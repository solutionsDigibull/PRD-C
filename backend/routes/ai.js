const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Helper: check if a form field value is empty (handles strings, arrays, objects)
const isFieldEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
};

// Get API configuration from environment
const getConfig = () => ({
  provider: process.env.AI_PROVIDER || 'openai',
  openaiKey: process.env.OPENAI_API_KEY,
  claudeKey: process.env.CLAUDE_API_KEY
});

// Call OpenAI API
const callOpenAI = async (prompt, systemPrompt = '') => {
  const { openaiKey } = getConfig();

  if (!openaiKey || openaiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured in .env file');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful product management assistant specializing in creating PRDs and product documentation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Call Claude API
const callClaude = async (prompt, systemPrompt = '') => {
  const { claudeKey } = getConfig();

  if (!claudeKey || claudeKey === 'your_claude_api_key_here') {
    throw new Error('Claude API key not configured in .env file');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemPrompt || 'You are a helpful product management assistant specializing in creating PRDs and product documentation.',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content[0].text;
};

// Fetch text content from a Google Drive or OneDrive shared link
async function fetchDriveLinkContent(url) {
  if (!url || !url.trim()) return { text: '', warning: 'No URL provided' };

  let fetchUrl = url.trim();

  // --- Google Drive URL conversions ---
  // Format: drive.google.com/file/d/ID/view
  const gdriveFileMatch = fetchUrl.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (gdriveFileMatch) {
    fetchUrl = `https://drive.google.com/uc?export=download&id=${gdriveFileMatch[1]}`;
  }
  // Format: drive.google.com/open?id=ID
  const gdriveOpenMatch = fetchUrl.match(/drive\.google\.com\/open\?id=([^&#]+)/);
  if (gdriveOpenMatch) {
    fetchUrl = `https://drive.google.com/uc?export=download&id=${gdriveOpenMatch[1]}`;
  }
  // Format: docs.google.com/document|spreadsheets|presentation/d/ID
  const gdocMatch = fetchUrl.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
  if (gdocMatch) {
    fetchUrl = `https://docs.google.com/${gdocMatch[1]}/d/${gdocMatch[2]}/export?format=${gdocMatch[1] === 'spreadsheets' ? 'csv' : 'txt'}`;
  }

  // --- OneDrive URL conversions ---
  if (fetchUrl.includes('1drv.ms') || fetchUrl.includes('onedrive.live.com') || fetchUrl.includes('sharepoint.com')) {
    if (fetchUrl.includes('onedrive.live.com')) {
      fetchUrl = fetchUrl.replace('redir?', 'download?');
    }
    if (!fetchUrl.includes('download=1')) {
      fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + 'download=1';
    }
  }

  // Fetch with redirect following
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { text: '', warning: 'Could not access the link. Make sure it is publicly shared.' };
    }

    const contentType = response.headers.get('content-type') || '';

    // Text-based content
    if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('csv') || contentType.includes('xml')) {
      let text = await response.text();

      // Google Drive sometimes returns an HTML confirmation page for large files
      // Detect it and try the confirm link
      if (contentType.includes('text/html') && text.includes('drive.usercontent.google.com') || text.includes('download_warning') || text.includes('confirm=')) {
        const confirmMatch = text.match(/confirm=([^&"']+)/);
        const idMatch = url.match(/(?:id=|\/d\/)([^/?&#]+)/);
        if (confirmMatch && idMatch) {
          try {
            const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${idMatch[1]}`;
            const controller2 = new AbortController();
            const timeout2 = setTimeout(() => controller2.abort(), 20000);
            const resp2 = await fetch(confirmUrl, {
              signal: controller2.signal,
              redirect: 'follow',
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            clearTimeout(timeout2);
            if (resp2.ok) {
              const ct2 = resp2.headers.get('content-type') || '';
              if (ct2.includes('text/') || ct2.includes('json') || ct2.includes('csv')) {
                text = await resp2.text();
              } else if (ct2.includes('pdf')) {
                const buffer = Buffer.from(await resp2.arrayBuffer());
                const data = await pdfParse(buffer);
                return { text: data.text || '' };
              } else if (ct2.includes('word') || ct2.includes('openxmlformats')) {
                const buffer = Buffer.from(await resp2.arrayBuffer());
                const result = await mammoth.extractRawText({ buffer });
                return { text: result.value || '' };
              }
            }
          } catch {
            // Fall through to use whatever we got
          }
        }

        // If it's still an HTML page (Google login/share page), extract any useful text
        if (text.includes('<html') && text.length < 500) {
          return { text: '', warning: 'Google Drive returned a login/sharing page. Make sure the link is set to "Anyone with the link can view".' };
        }
      }

      if (text.length > 50000) text = text.substring(0, 50000) + '\n... [truncated]';
      return { text };
    }

    // PDF content
    if (contentType.includes('pdf')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const data = await pdfParse(buffer);
      let text = data.text || '';
      if (text.length > 50000) text = text.substring(0, 50000) + '\n... [truncated]';
      return { text };
    }

    // DOCX content
    if (contentType.includes('word') || contentType.includes('openxmlformats-officedocument.wordprocessingml')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      let text = result.value || '';
      if (text.length > 50000) text = text.substring(0, 50000) + '\n... [truncated]';
      return { text };
    }

    // Other binary — just note it
    return { text: `[Binary file: ${contentType}]` };
  } catch (err) {
    return { text: '', warning: 'Could not fetch content from the link. Ensure the file is publicly accessible.' };
  }
}

// Generic AI call based on provider
const callAI = async (prompt, systemPrompt = '') => {
  const { provider } = getConfig();

  if (provider === 'claude') {
    return callClaude(prompt, systemPrompt);
  }
  return callOpenAI(prompt, systemPrompt);
};

// Check configuration status
router.get('/status', (req, res) => {
  const config = getConfig();
  const isConfigured = config.provider === 'claude'
    ? (config.claudeKey && config.claudeKey !== 'your_claude_api_key_here')
    : (config.openaiKey && config.openaiKey !== 'your_openai_api_key_here');

  res.json({
    provider: config.provider,
    configured: isConfigured
  });
});

// Enhance problem statement
router.post('/enhance-problem', async (req, res, next) => {
  try {
    const { currentText, appName, appIdea } = req.body;

    const prompt = `Improve and enhance this problem statement for a product called "${appName}" (${appIdea}):

Current problem statement: "${currentText || 'Not provided'}"

Please provide an enhanced, clear, and measurable problem statement that:
1. Clearly identifies the target users
2. Describes specific pain points
3. Quantifies the impact where possible
4. Is focused and actionable

Return only the enhanced problem statement text, no explanations.`;

    const result = await callAI(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Enhance goal
router.post('/enhance-goal', async (req, res, next) => {
  try {
    const { currentText, appName, problemStatement } = req.body;

    const prompt = `Create or enhance the main goal for a product called "${appName}":

Problem being solved: "${problemStatement || 'Not specified'}"
Current goal: "${currentText || 'Not provided'}"

Please provide a clear, measurable goal that:
1. Directly addresses the problem statement
2. Includes specific success metrics (e.g., percentages, ratings)
3. Is achievable and time-bound
4. Focuses on user outcomes

Return only the enhanced goal text, no explanations.`;

    const result = await callAI(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Suggest out of scope
router.post('/suggest-out-of-scope', async (req, res, next) => {
  try {
    const { appName, appIdea, platform } = req.body;

    const prompt = `For a ${platform || 'application'} called "${appName}" that "${appIdea}", suggest items that should be OUT OF SCOPE for version 1.0:

Provide a bulleted list of features/functionality that should be excluded from the initial release to maintain focus. Consider:
- Mobile apps if web-focused (or vice versa)
- Advanced integrations
- Internationalization
- Premium features
- Complex analytics
- Third-party marketplace

Return only the bulleted list, no explanations.`;

    const result = await callAI(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Recommend full tech stack
router.post('/recommend-apis', async (req, res, next) => {
  try {
    const { appName, appIdea, platform, techStack } = req.body;

    // Show what's already selected so AI can complement
    const currentSelections = Object.entries(techStack || {})
      .filter(([k, v]) => Array.isArray(v) ? v.length > 0 : v)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    const prompt = `For a ${platform || 'web'} application called "${appName}" that "${appIdea}", recommend the best technology stack.

${currentSelections ? `Current selections:\n${currentSelections}\n` : ''}
Recommend technologies for ALL of these categories:
- frontend: UI framework (e.g., React, Next.js, Vue.js)
- css: CSS framework/library (e.g., Tailwind CSS, Material UI)
- backend: Server/backend (e.g., Node.js/Express, Supabase, Python/FastAPI)
- llm: LLM engine (e.g., Claude Sonnet, GPT-4o)
- mcp: MCP integrations (e.g., Claude MCP, GitHub MCP)
- testing: Testing tools (e.g., Jest, Playwright, Cypress)
- deployment: Deployment platform (e.g., Vercel, Docker, AWS)
- reporting: Reporting/analytics (e.g., Metabase, Grafana)
- apis: Essential APIs (e.g., Stripe, SendGrid, Auth0)
- localLlm: Local LLM tools (e.g., Ollama, LM Studio)
- evalTools: Eval/monitoring tools (e.g., LangSmith, Promptfoo)
- additional: Additional tools (e.g., Redis, PostgreSQL, GraphQL)

Return ONLY valid JSON with this exact format (each value is an array of 2-4 recommended items):
{"frontend":["React"],"css":["Tailwind CSS"],"backend":["Node.js/Express"],"llm":["Claude Sonnet"],"mcp":["Claude MCP"],"testing":["Jest"],"deployment":["Vercel"],"reporting":["Metabase"],"apis":["Stripe"],"localLlm":["Ollama"],"evalTools":["LangSmith"],"additional":["PostgreSQL"]}

Only recommend what makes sense for this specific app. If a category is not relevant, use an empty array [].`;

    const response = await callAI(prompt);

    // Parse JSON from response
    let recommendations = {};
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      // Fallback: try line-by-line parsing
      const fields = ['frontend', 'css', 'backend', 'llm', 'mcp', 'testing', 'deployment', 'reporting', 'apis', 'localLlm', 'evalTools', 'additional'];
      fields.forEach(field => {
        const match = response.match(new RegExp(`${field}[:\\s]+(.+)`, 'i'));
        if (match) {
          recommendations[field] = match[1].split(',').map(s => s.trim().replace(/["\[\]]/g, '')).filter(Boolean);
        }
      });
    }

    // Ensure all values are arrays
    const allFields = ['frontend', 'css', 'backend', 'llm', 'mcp', 'testing', 'deployment', 'reporting', 'apis', 'localLlm', 'evalTools', 'additional'];
    const result = {};
    allFields.forEach(field => {
      const val = recommendations[field];
      if (Array.isArray(val)) {
        result[field] = val;
      } else if (typeof val === 'string' && val) {
        result[field] = val.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        result[field] = [];
      }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Discover competitors
router.post('/discover-competitors', async (req, res, next) => {
  try {
    const { appName, appIdea, targetAudience } = req.body;

    const prompt = `You are a product strategist helping build a PRD (Product Requirements Document) for "${appName}" — ${appIdea}.
Target audience: ${(targetAudience || []).join(', ') || 'general users'}.

Identify 3 main competitors or alternative solutions in this space. For each competitor, provide a PRD-relevant analysis covering:
- Key features that overlap with or threaten our product
- Their target audience and market positioning
- Gaps or weaknesses we can exploit as product differentiators
- Feature parity requirements (what we MUST match to compete)

Format as JSON array:
[
  {"name": "Competitor Name", "url": "https://competitor.com", "analysis": "PRD-relevant analysis here"},
  ...
]

Return only the JSON array, no other text.`;

    const response = await callAI(prompt);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const competitors = JSON.parse(jsonMatch[0]).map(c => ({
          name: c.name || '',
          url: c.url || '',
          analysis: typeof c.analysis === 'string' ? c.analysis : formatAnalysisObject(c.analysis)
        }));
        res.json({ success: true, data: competitors });
        return;
      }
    } catch (e) {
      console.error('Failed to parse competitor JSON:', e);
    }

    res.json({
      success: true,
      data: [
        { name: '', url: '', analysis: '' },
        { name: '', url: '', analysis: '' },
        { name: '', url: '', analysis: '' }
      ]
    });
  } catch (error) {
    next(error);
  }
});

// Helper: flatten a nested analysis object into readable text
function formatAnalysisObject(obj) {
  if (!obj || typeof obj === 'string') return obj || '';
  return Object.entries(obj).map(([key, val]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (Array.isArray(val)) return `${label}:\n${val.map(v => `  - ${v}`).join('\n')}`;
    return `${label}: ${val}`;
  }).join('\n\n');
}

// Helper: flatten nested painPoints object into readable text
function formatPainPointsObject(obj) {
  if (!obj || typeof obj === 'string') return obj || '';
  let sections = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.toLowerCase() === 'prd opportunity' || key === 'PRD Opportunity') {
      sections.push(`**PRD Opportunity:**\n${val}`);
    } else if (Array.isArray(val)) {
      sections.push(`**${key}:**\n${val.map(v => `- ${v}`).join('\n')}`);
    } else {
      sections.push(`**${key}:**\n${val}`);
    }
  }
  return sections.join('\n\n');
}

// Discover competitor pain points from review sites
router.post('/discover-competitor-painpoints', async (req, res, next) => {
  try {
    const { competitorName, appName, appIdea } = req.body;

    if (!competitorName) {
      return res.status(400).json({ success: false, error: 'Competitor name is required' });
    }

    const prompt = `You are a competitive intelligence analyst helping build a PRD for "${appName}" — ${appIdea}.

Research the competitor "${competitorName}" and extract user pain points, complaints, and negative feedback as commonly found on software review platforms. Organize by source:

**G2 Reviews:**
- List 3-5 common pain points/complaints users report about "${competitorName}" on G2
- Focus on feature gaps, UX issues, pricing concerns, and support problems

**TrustRadius Reviews:**
- List 3-5 common pain points/complaints users report about "${competitorName}" on TrustRadius
- Focus on enterprise concerns, integration issues, and scalability problems

**SourceForge Reviews:**
- List 3-5 common pain points/complaints users report about "${competitorName}" on SourceForge
- Focus on technical issues, missing features, and community feedback

End with a brief "PRD Opportunity" summary: 2-3 sentences on how our product "${appName}" can address these pain points as competitive advantages.

Also provide the competitor's website URL.

Format as JSON:
{"url": "https://competitor.com", "painPoints": "the full formatted text above with G2, TrustRadius, SourceForge sections and PRD Opportunity"}

Return only the JSON object, no other text.`;

    const response = await callAI(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          data: {
            url: result.url || '',
            painPoints: typeof result.painPoints === 'string' ? result.painPoints : formatPainPointsObject(result.painPoints)
          }
        });
        return;
      }
    } catch (e) {
      console.error('Failed to parse pain points JSON:', e);
    }

    res.json({ success: false, error: 'Failed to extract pain points' });
  } catch (error) {
    next(error);
  }
});

// Suggest chart guidelines
router.post('/suggest-chart-guidelines', async (req, res, next) => {
  try {
    const { primaryColor, secondaryColor } = req.body;

    const prompt = `Suggest brief chart and data visualization guidelines for an app with primary color ${primaryColor} and secondary color ${secondaryColor}.

Include guidelines for:
- Color usage in charts
- Legend and label styling
- Grid lines
- Tooltips
- Corner radius for bar charts

Keep it concise, under 200 characters. Return only the guidelines text.`;

    const result = await callAI(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Suggest image guidelines
router.post('/suggest-image-guidelines', async (req, res, next) => {
  try {
    const { borderRadius, aspectRatio } = req.body;

    const prompt = `Suggest brief image treatment guidelines for an app using ${borderRadius} border radius and ${aspectRatio} aspect ratio.

Include guidelines for:
- Shadows
- Filters/effects
- Compression
- Format preferences

Keep it concise, under 200 characters. Return only the guidelines text.`;

    const result = await callAI(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Generate full PRD
router.post('/generate-prd', async (req, res, next) => {
  try {
    const { formData } = req.body;

    const prompt = `Generate a comprehensive Product Requirements Document (PRD) using the ISTVON framework for:

**App Name:** ${formData.appName}
**App Idea:** ${formData.appIdea}
**Platform:** ${Array.isArray(formData.platform) ? formData.platform.join(', ') : formData.platform}

**Problem Statement:**
${formData.problemStatement}

**Goal:**
${formData.goal}

**Target Audience:**
- Demographics: ${(formData.targetAudienceDemography || []).join(', ')}
- Geography: ${(formData.targetAudienceGeography || []).join(', ')}

**App Structure:**
- Default Screen: ${formData.appStructure?.defaultScreen || ''}
- Working Screen: ${formData.appStructure?.workingScreen || ''}
- Other Screens: ${formData.appStructure?.otherScreens || ''}

**Technology Stack:**
${Object.entries(formData.selectedTechStack || {}).filter(([k, v]) => Array.isArray(v) ? v.length > 0 : v).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

**Competitors:**
${(formData.competitors || []).filter(c => c.name).map(c => `- ${c.name}: ${c.analysis}`).join('\n')}

**Visual Design:**
- Primary Color: ${formData.primaryColor}
- Secondary Color: ${formData.secondaryColor}
- Primary Font: ${formData.primaryFont}
- Heading Font: ${formData.headingsFont}

**Out of Scope (v1.0):**
${formData.outOfScope}

**Project Details:**
- Type: ${formData.projectType}
- Due Date: ${formData.dueDate}
- Version: ${formData.prdVersion}

Generate a complete PRD with these sections:
1. Executive Summary
2. Product Vision
3. Target Users & Personas
4. Problem Statement
5. Solution Overview
6. Feature Requirements (detailed)
7. App Structure & Navigation
8. Technology Stack Justification
9. Visual Design System
10. Competition Analysis
11. Success Metrics & KPIs
12. Out of Scope
13. Timeline & Milestones
14. Risks & Mitigations
15. Appendix

Use markdown formatting. Be comprehensive but concise.`;

    const systemPrompt = `You are an expert product manager creating a PRD using the ISTVON framework.
The ISTVON framework emphasizes:
- I: Insights from user research
- S: Strategy alignment
- T: Technical feasibility
- V: Value proposition
- O: Operational considerations
- N: Next steps and timeline

Create professional, actionable documentation.`;

    const result = await callAI(prompt, systemPrompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Generate proposal cover letter
router.post('/generate-proposal', async (req, res, next) => {
  try {
    const { formData, templateType } = req.body;

    // Format timeline details
    const projectType = formData.projectType ? `Project Type: ${formData.projectType}` : '';
    const dueDate = formData.dueDate ? `Due Date: ${formData.dueDate}` : '';
    const milestones = (formData.milestones || []).length > 0
      ? formData.milestones.map(m => `• ${m.name} - ${m.date}${m.description ? ': ' + m.description : ''}`).join('\n')
      : '';
    const timelineInfo = [projectType, dueDate].filter(Boolean).join(' | ');

    const prompts = {
      coverLetter: `Write a professional email cover letter for "${formData.appName}" project proposal.

PROJECT DETAILS:
- App Name: ${formData.appName}
- App Idea: ${formData.appIdea}
- Goal: ${formData.goal}
- Problem Statement: ${formData.problemStatement}
- Target Audience: ${(formData.targetAudienceDemography || []).join(', ')} in ${(formData.targetAudienceGeography || []).join(', ')}
- Platform: ${Array.isArray(formData.platform) ? formData.platform.join(', ') : formData.platform}
- Timeline: ${timelineInfo || 'To be discussed'}
${milestones ? `\nMilestones:\n${milestones}` : ''}

FORMAT:
1. Professional greeting
2. Brief introduction (who we are)
3. Executive summary of the project (2-3 sentences)
4. Key deliverables (bullet points)
5. Tentative commercials section with:
   - Estimated project cost range: [Provide realistic estimate based on scope]
   - Payment terms: [Suggest standard terms]
   - Timeline summary
6. Call to action
7. Professional closing

Keep it concise, professional, and suitable for email. Address to [Client Name].`,

      salesProposal: `Create a comprehensive Standard Sales Proposal for "${formData.appName}" following this exact structure:

PROJECT INFORMATION:
- App Name: ${formData.appName}
- App Idea: ${formData.appIdea}
- Goal: ${formData.goal}
- Problem Statement: ${formData.problemStatement}
- Target Audience: ${(formData.targetAudienceDemography || []).join(', ')} in ${(formData.targetAudienceGeography || []).join(', ')}
- Platform: ${Array.isArray(formData.platform) ? formData.platform.join(', ') : formData.platform}
- Tech Stack: ${Object.entries(formData.selectedTechStack || {}).filter(([k, v]) => Array.isArray(v) ? v.length > 0 : v).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(', ')}
- Timeline: ${timelineInfo || 'To be discussed'}
${milestones ? `\nMilestones:\n${milestones}` : ''}

REQUIRED SECTIONS (use markdown headers):

## 1. EXECUTIVE SUMMARY
High-level overview of the solution and value proposition (3-4 sentences)

## 2. CLIENT CHALLENGES
Specific pain points being addressed (bullet points based on problem statement)

## 3. PROPOSED SOLUTION
How our offering addresses each challenge with concrete deliverables

## 4. IMPLEMENTATION APPROACH
- Development phases
- Timeline with milestones
- Methodology (Agile/iterative approach)

## 5. PRICING & COMMERCIAL TERMS
- Project cost estimate (provide realistic range)
- Payment schedule
- What's included
- Optional add-ons

## 6. WHY CHOOSE US
- Key differentiators
- Relevant experience
- Quality assurance approach

## 7. NEXT STEPS
- Immediate actions
- Decision timeline
- Contact information

Make it professional, specific to the project details, and ready to present to stakeholders.`
    };

    const systemPrompt = `You are an expert sales proposal writer. Create professional, persuasive proposals that are specific to the client's needs. Use markdown formatting for headers and structure. Be realistic with estimates and timelines.`;

    const result = await callAI(prompts[templateType] || prompts.coverLetter, systemPrompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Enhance PRD prompt
router.post('/enhance-prd-prompt', async (req, res, next) => {
  try {
    const { currentPrompt, appName, appIdea } = req.body;

    const prompt = `Rewrite and enhance the following PRD prompt for an app called "${appName || 'the app'}".
App Idea: ${appIdea || 'Not specified'}

Original prompt to enhance:
${currentPrompt}

Create a concise, professional PRD prompt (max 1150 characters) that:
1. Incorporates the app name and idea naturally
2. Maintains the BuLLM Coding System reference and ISTVON framework principles
3. Keeps the core requirements: interviewing about purpose/audience, translating to features/flows, creating full app structure, Home/Admin panels, enhancements like AI input and recommendations, documentation
4. Is clear, actionable, and ready for PRD generation

Return only the enhanced prompt text, no explanations or headers.`;

    const systemPrompt = `You are an expert prompt engineer specializing in PRD generation. Create concise, comprehensive prompts that will guide AI to generate high-quality Product Requirements Documents.`;

    const result = await callAI(prompt, systemPrompt);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Analyze uploaded files and extract PRD-relevant information
router.post('/analyze-files', async (req, res, next) => {
  try {
    const { files, currentFormData } = req.body;

    if (!files || files.length === 0) {
      return res.json({ success: true, data: { fields: {}, relevantCount: 0 } });
    }

    // Extract text content from files
    const fileContents = files.map(file => {
      const isTextFile = file.type && (
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        file.type === 'application/csv' ||
        file.type === 'text/csv'
      );

      if (isTextFile && file.base64) {
        try {
          const decoded = Buffer.from(file.base64, 'base64').toString('utf-8');
          return `[${file.name}]:\n${decoded}`;
        } catch {
          return `[${file.name}]: <${file.type} file - could not decode>`;
        }
      }

      // For non-text files, provide name and type as context
      return `[${file.name}]: <${file.type || 'unknown type'} file - name suggests ${file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}>`;
    }).join('\n\n');

    // Determine which fields are currently empty
    const targetFields = {
      appName: 'App name',
      appIdea: 'Brief app description (max 100 chars)',
      problemStatement: 'Problems the app solves',
      goal: 'Primary measurable objective',
      outOfScope: 'Features excluded from v1.0',
      platform: 'Target platform (e.g., Web App, Mobile App, Cross-Platform)',
      prdPromptTemplate: 'Custom PRD generation prompt'
    };

    const emptyFields = Object.entries(targetFields)
      .filter(([key]) => isFieldEmpty(currentFormData[key]))
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join('\n');

    if (!emptyFields) {
      return res.json({ success: true, data: { fields: {}, relevantCount: 0 } });
    }

    const prompt = `You are reading the full content of uploaded files. The files will NOT have neat headings like "Problem Statement" or "Goal". They may be meeting notes, brainstorm docs, pitch decks, emails, requirements lists, or any unstructured text.

Your job: read everything carefully, understand the product/app being described, then extract and map relevant information to the PRD fields listed below.

--- FILE CONTENTS START ---
${fileContents}
--- FILE CONTENTS END ---

Map information to these currently empty PRD fields:
${emptyFields}

Instructions:
- Read the entire content holistically — do not look for literal field-name headings.
- Infer the app name from context (product name, project title, etc.).
- Infer the problem statement from pain points, user complaints, market gaps, or "why" descriptions.
- Infer the goal from success criteria, KPIs, objectives, or desired outcomes.
- Infer out-of-scope from anything explicitly deferred, deprioritized, or marked as future/v2.
- For appIdea, write a concise one-liner (max 100 chars) summarizing what the app does.
- For platform, only fill if the content clearly mentions web, mobile, iOS, Android, desktop, etc.
- Only include fields where you found genuinely relevant information. Do not guess or fabricate.
- If nothing relevant is found, return an empty object {}.

Return ONLY a raw JSON object. No markdown, no code blocks, no explanation.`;

    const systemPrompt = 'You are a senior product analyst. You specialize in reading unstructured documents — meeting notes, emails, brainstorms, pitch decks — and extracting structured product requirements. Be accurate. Never fabricate. Return only valid JSON.';

    const result = await callAI(prompt, systemPrompt);

    // Parse AI response as JSON
    let fields = {};
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fields = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI file analysis response:', e);
      fields = {};
    }

    // Filter to only target fields that are empty
    const validFields = {};
    for (const key of Object.keys(targetFields)) {
      if (fields[key] && (isFieldEmpty(currentFormData[key]))) {
        validFields[key] = fields[key];
      }
    }

    const relevantCount = Object.keys(validFields).length;

    res.json({ success: true, data: { fields: validFields, relevantCount } });
  } catch (error) {
    next(error);
  }
});

// Analyze content from a Google Drive or OneDrive shared link
router.post('/analyze-link', async (req, res, next) => {
  try {
    const { url, source, currentFormData } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'No URL provided' });
    }

    const { text: textContent, warning } = await fetchDriveLinkContent(url);

    if (warning && !textContent.trim()) {
      return res.json({ success: true, data: { fields: {}, relevantCount: 0, warning } });
    }

    if (!textContent.trim()) {
      return res.json({ success: true, data: { fields: {}, relevantCount: 0, warning: 'The linked document appears to be empty.' } });
    }

    // Determine which fields are currently empty
    const targetFields = {
      appName: 'App name',
      appIdea: 'Brief app description (max 100 chars)',
      problemStatement: 'Problems the app solves',
      goal: 'Primary measurable objective',
      outOfScope: 'Features excluded from v1.0',
      platform: 'Target platform (e.g., Web App, Mobile App, Cross-Platform)',
      prdPromptTemplate: 'Custom PRD generation prompt'
    };

    const emptyFields = Object.entries(targetFields)
      .filter(([key]) => isFieldEmpty(currentFormData[key]))
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join('\n');

    if (!emptyFields) {
      return res.json({ success: true, data: { fields: {}, relevantCount: 0 } });
    }

    const prompt = `You are reading content fetched from a ${source || 'cloud storage'} shared link. The content may be a document, spreadsheet, notes, or any unstructured text. It will NOT have neat headings like "Problem Statement" or "Goal".

Your job: read everything carefully, understand the product/app being described, then extract and map relevant information to the PRD fields listed below.

--- DOCUMENT CONTENT START ---
${textContent}
--- DOCUMENT CONTENT END ---

Map information to these currently empty PRD fields:
${emptyFields}

Instructions:
- Read the entire content holistically — do not look for literal field-name headings.
- Infer the app name from context (product name, project title, etc.).
- Infer the problem statement from pain points, user complaints, market gaps, or "why" descriptions.
- Infer the goal from success criteria, KPIs, objectives, or desired outcomes.
- Infer out-of-scope from anything explicitly deferred, deprioritized, or marked as future/v2.
- For appIdea, write a concise one-liner (max 100 chars) summarizing what the app does.
- For platform, only fill if the content clearly mentions web, mobile, iOS, Android, desktop, etc.
- Only include fields where you found genuinely relevant information. Do not guess or fabricate.
- If nothing relevant is found, return an empty object {}.

Return ONLY a raw JSON object. No markdown, no code blocks, no explanation.`;

    const systemPrompt = 'You are a senior product analyst. You specialize in reading unstructured documents and extracting structured product requirements. Be accurate. Never fabricate. Return only valid JSON.';

    const result = await callAI(prompt, systemPrompt);

    let fields = {};
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fields = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI link analysis response:', e);
      fields = {};
    }

    // Filter to only target fields that are empty
    const validFields = {};
    for (const key of Object.keys(targetFields)) {
      if (fields[key] && (isFieldEmpty(currentFormData[key]))) {
        validFields[key] = fields[key];
      }
    }

    const relevantCount = Object.keys(validFields).length;
    res.json({ success: true, data: { fields: validFields, relevantCount } });
  } catch (error) {
    next(error);
  }
});

// === Claude Cowork: scan local folder + all sources, analyze with AI ===

const SKIP_DIRS = new Set([
  'node_modules', '.git', '__pycache__', '.next', 'dist', 'build',
  'coverage', 'vendor', '.cache', '.vscode', '.idea', 'venv', 'env'
]);

const SKIP_FILE_PATTERNS = ['.env', 'credentials', 'secret', 'password', '.key', '.pem', '.pfx'];

const READABLE_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.log', '.xml', '.yaml', '.yml',
  '.html', '.htm', '.js', '.ts', '.jsx', '.tsx', '.py', '.java',
  '.sql', '.sh', '.bat', '.ini', '.cfg', '.conf', '.toml'
]);

const MAX_SCAN_DEPTH = 3;
const MAX_FILES = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_TOTAL_TEXT = 50000;

// Recursively scan a directory for readable files
function scanDirectory(dirPath, depth = 0) {
  const results = [];
  if (depth > MAX_SCAN_DEPTH) return results;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (results.length >= MAX_FILES) break;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      results.push(...scanDirectory(fullPath, depth + 1));
    } else if (entry.isFile()) {
      // Skip sensitive files
      const nameLower = entry.name.toLowerCase();
      if (SKIP_FILE_PATTERNS.some(p => nameLower.includes(p))) continue;

      const ext = path.extname(nameLower);
      const isReadableText = READABLE_EXTENSIONS.has(ext);
      const isPdf = ext === '.pdf';
      const isDocx = ext === '.docx';

      if (!isReadableText && !isPdf && !isDocx) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE || stat.size === 0) continue;
        results.push({ path: fullPath, name: entry.name, ext, size: stat.size, isPdf, isDocx });
      } catch {
        continue;
      }
    }

    if (results.length >= MAX_FILES) break;
  }

  return results;
}

// Extract text from a single local file
async function extractFileText(fileInfo) {
  try {
    if (fileInfo.isPdf) {
      const buffer = fs.readFileSync(fileInfo.path);
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    if (fileInfo.isDocx) {
      const buffer = fs.readFileSync(fileInfo.path);
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    // Plain text
    return fs.readFileSync(fileInfo.path, 'utf-8');
  } catch {
    return `[Could not read ${fileInfo.name}]`;
  }
}

router.post('/cowork-fetch', async (req, res, next) => {
  try {
    const {
      folderPath,
      uploadedFiles,
      googleDriveLink,
      oneDriveLink,
      currentFormData,
      sources
    } = req.body;

    const allTexts = [];
    const scannedFiles = [];
    let totalChars = 0;

    // --- 1. Scan local folder ---
    if (sources?.localFolder && folderPath && folderPath.trim()) {
      const rawPath = folderPath.trim();

      // Security: block path traversal
      if (rawPath.includes('..')) {
        return res.status(400).json({ success: false, error: 'Invalid folder path' });
      }

      // Use the path as-is — normalize slashes but don't resolve against CWD
      const cleanPath = path.normalize(rawPath);

      if (!fs.existsSync(cleanPath) || !fs.statSync(cleanPath).isDirectory()) {
        return res.json({
          success: true,
          data: { fields: {}, relevantCount: 0, scannedCount: 0, warning: `Folder not found: ${cleanPath}` }
        });
      }

      const localFiles = scanDirectory(cleanPath);

      for (const fileInfo of localFiles) {
        if (totalChars >= MAX_TOTAL_TEXT) break;
        const text = await extractFileText(fileInfo);
        const trimmed = text.substring(0, MAX_TOTAL_TEXT - totalChars);
        allTexts.push(`[LOCAL: ${fileInfo.name}]:\n${trimmed}`);
        scannedFiles.push({ name: fileInfo.name, source: 'local' });
        totalChars += trimmed.length;
      }
    }

    // --- 2. Process uploaded files ---
    if (sources?.uploadedFiles && uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        if (totalChars >= MAX_TOTAL_TEXT) break;

        const isTextFile = file.type && (
          file.type.startsWith('text/') ||
          file.type === 'application/json' ||
          file.type === 'application/csv' ||
          file.type === 'text/csv'
        );

        if (isTextFile && file.base64) {
          try {
            const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            const trimmed = decoded.substring(0, MAX_TOTAL_TEXT - totalChars);
            allTexts.push(`[UPLOADED: ${file.name}]:\n${trimmed}`);
            scannedFiles.push({ name: file.name, source: 'uploaded' });
            totalChars += trimmed.length;
          } catch {
            allTexts.push(`[UPLOADED: ${file.name}]: <could not decode>`);
            scannedFiles.push({ name: file.name, source: 'uploaded' });
          }
        } else if (file.name && (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) && file.base64) {
          try {
            const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
            const buffer = Buffer.from(base64Data, 'base64');
            let text = '';
            if (file.name.endsWith('.pdf')) {
              const data = await pdfParse(buffer);
              text = data.text || '';
            } else {
              const result = await mammoth.extractRawText({ buffer });
              text = result.value || '';
            }
            const trimmed = text.substring(0, MAX_TOTAL_TEXT - totalChars);
            allTexts.push(`[UPLOADED: ${file.name}]:\n${trimmed}`);
            scannedFiles.push({ name: file.name, source: 'uploaded' });
            totalChars += trimmed.length;
          } catch {
            allTexts.push(`[UPLOADED: ${file.name}]: <binary file>`);
            scannedFiles.push({ name: file.name, source: 'uploaded' });
          }
        } else {
          allTexts.push(`[UPLOADED: ${file.name}]: <${file.type || 'unknown'} file>`);
          scannedFiles.push({ name: file.name, source: 'uploaded' });
        }
      }
    }

    // --- 3. Fetch Google Drive link ---
    if (sources?.googleDrive && googleDriveLink && googleDriveLink.trim()) {
      try {
        const { text } = await fetchDriveLinkContent(googleDriveLink);
        if (text && text.trim()) {
          const trimmed = text.substring(0, MAX_TOTAL_TEXT - totalChars);
          allTexts.push(`[GOOGLE DRIVE]:\n${trimmed}`);
          scannedFiles.push({ name: 'Google Drive document', source: 'google_drive' });
          totalChars += trimmed.length;
        }
      } catch {
        // Skip Google Drive on error
      }
    }

    // --- 4. Fetch OneDrive link ---
    if (sources?.oneDrive && oneDriveLink && oneDriveLink.trim()) {
      try {
        const { text } = await fetchDriveLinkContent(oneDriveLink);
        if (text && text.trim()) {
          const trimmed = text.substring(0, MAX_TOTAL_TEXT - totalChars);
          allTexts.push(`[ONEDRIVE]:\n${trimmed}`);
          scannedFiles.push({ name: 'OneDrive document', source: 'onedrive' });
          totalChars += trimmed.length;
        }
      } catch {
        // Skip OneDrive on error
      }
    }

    // --- 5. Match scanned files to BuLLM Document Checklist categories ---
    const categoryKeywords = {
      app_idea: ['idea', 'concept', 'vision', 'pitch', 'overview', 'brief', 'proposal', 'summary', 'about'],
      design_doc: ['design', 'sdd', 'srs', 'brd', 'frd', 'functional', 'software design', 'spec', 'requirement'],
      notebooklm: ['notebooklm', 'notebook', 'nlm'],
      storm_pdf: ['storm', 'storm pdf'],
      client_expectations: ['client', 'expectation', 'stakeholder', 'scope'],
      process_flow: ['flow', 'process', 'journey', 'workflow', 'diagram', 'wireframe', 'sitemap', 'navigation', 'ux', 'ui'],
      data_schema: ['schema', 'data', 'database', 'erd', 'model', 'entity', 'table', 'sql', 'migration'],
      video_walkthrough: ['video', 'walkthrough', 'demo', 'recording', 'screencast', 'mp4', 'mov', 'webm'],
      screenshots: ['screenshot', 'screen', 'capture', 'snapshot', 'existing tool', 'png', 'jpg', 'jpeg'],
      legacy_code: ['legacy', 'code', 'source', 'codebase', 'repo'],
      competitive_tools: ['competitor', 'competition', 'competitive', 'market', 'benchmark', 'comparison', 'landscape'],
      integrations_3p: ['3rd party', 'third party', 'external', 'plugin', 'addon'],
      apis: ['api', 'endpoint', 'rest', 'graphql', 'swagger', 'openapi'],
      mcps: ['mcp', 'model context'],
      integrations: ['integration', 'connect', 'sync', 'webhook', 'oauth']
    };

    const categoryLabels = {
      app_idea: 'App Idea Document', design_doc: 'Software Design Document', notebooklm: 'NotebookLM',
      storm_pdf: 'STORM PDF', client_expectations: 'Client Expectations', process_flow: 'Proposed Process Flow',
      data_schema: 'Data schema', video_walkthrough: 'Video walkthrough', screenshots: 'Screenshots of existing tool',
      legacy_code: 'Legacy Code', competitive_tools: 'List of competitive tools & websites',
      integrations_3p: 'Integrations with 3rd party tools', apis: 'APIs', mcps: 'MCPs', integrations: 'Integrations'
    };

    // Match each scanned file to a checklist category
    const matchedFiles = [];
    for (const file of scannedFiles) {
      const nameLower = file.name.toLowerCase().replace(/[_\-./\\]/g, ' ');
      let matchedCategory = null;
      for (const [catId, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => nameLower.includes(kw))) {
          matchedCategory = catId;
          break;
        }
      }
      matchedFiles.push({
        ...file,
        category: matchedCategory,
        categoryLabel: matchedCategory ? categoryLabels[matchedCategory] : null
      });
    }

    const categorizedFiles = matchedFiles.filter(f => f.category);

    // --- 6. Check if any files matched ---
    if (categorizedFiles.length === 0 && allTexts.length === 0) {
      return res.json({
        success: true,
        data: { fields: {}, relevantCount: 0, scannedCount: scannedFiles.length, scannedFiles: matchedFiles, warning: 'No files matching BuLLM Document Checklist categories were found.' }
      });
    }

    // --- 7. Determine empty fields ---
    const targetFields = {
      appName: 'App name',
      appIdea: 'Brief app description (max 100 chars)',
      problemStatement: 'Problems the app solves',
      goal: 'Primary measurable objective',
      outOfScope: 'Features excluded from v1.0',
      platform: 'Target platform (e.g., Web App, Mobile App, Cross-Platform)',
      prdPromptTemplate: 'Custom PRD generation prompt'
    };

    const emptyFields = Object.entries(targetFields)
      .filter(([key]) => isFieldEmpty(currentFormData[key]))
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join('\n');

    if (!emptyFields) {
      return res.json({
        success: true,
        data: { fields: {}, relevantCount: 0, scannedCount: scannedFiles.length, scannedFiles: matchedFiles }
      });
    }

    // --- 8. Build file-to-category mapping for AI context ---
    const fileMapping = matchedFiles.map(f =>
      `- "${f.name}" (source: ${f.source}) → Category: ${f.categoryLabel || 'Uncategorized'}`
    ).join('\n');

    // --- 9. AI analysis ---
    const combinedContent = allTexts.join('\n\n---\n\n');

    // Check if App Name is already provided — use it as search context
    const existingAppName = currentFormData?.appName?.trim() || '';
    const appNameContext = existingAppName
      ? `\nIMPORTANT CONTEXT: The user has already specified the App Name as "${existingAppName}". Use this as your PRIMARY search context:\n- PRIORITIZE and extract information that is specifically relevant to "${existingAppName}".\n- If files contain information about multiple projects or apps, ONLY extract details related to "${existingAppName}".\n- Ignore content that is clearly about a different app or project.\n- Do NOT overwrite the appName field — it is already set.\n`
      : '';

    const prompt = `You are reading content gathered from multiple sources. Here are the files and their suggested categories based on filenames:

${fileMapping}
${appNameContext}
--- ALL DOCUMENT CONTENTS (${scannedFiles.length} files) ---
${combinedContent}
--- END OF DOCUMENTS ---

Map information to these currently empty PRD fields:
${emptyFields}

Instructions:
- Read the ACTUAL CONTENT of EVERY file, regardless of its filename or category. Do NOT skip files just because they are "Uncategorized" — a file named "document.txt" may contain critical information about the app, requirements, goals, etc.
- Extract relevant information based on what the file CONTAINS, not what the file is NAMED.
- A single file may contain information relevant to MULTIPLE fields — extract all of them.
- For EACH field you extract, you MUST specify which file (by exact filename) the information came from.${existingAppName ? `\n- The app name "${existingAppName}" is already set. Focus all extraction on information relevant to this app. Do NOT include the appName field in your response.` : '\n- Infer the app name from context (product name, project title, etc.).'}
- Infer the problem statement from pain points, user complaints, market gaps, or "why" descriptions.
- Infer the goal from success criteria, KPIs, objectives, or desired outcomes.
- Infer out-of-scope from anything explicitly deferred, deprioritized, or marked as future/v2.
- For appIdea, write a concise one-liner (max 100 chars) summarizing what the app does.
- For platform, only fill if content clearly mentions web, mobile, iOS, Android, desktop, etc.
- Only include fields where you found genuinely relevant information. Do not guess or fabricate.
- If nothing relevant is found for a field, omit it.

Return a JSON object where each key is a field name and the value is an object with "value" (the extracted text) and "sourceFile" (exact filename it was extracted from). If information for a field comes from multiple files, use the most comprehensive source.
Example: {"appName": {"value": "TaskFlow", "sourceFile": "app-idea.pdf"}, "problemStatement": {"value": "...", "sourceFile": "client-expectations.docx"}}

Return ONLY the raw JSON object. No markdown, no code blocks, no explanation.`;

    const systemPrompt = 'You are a senior product analyst. You specialize in reading diverse unstructured documents — meeting notes, code files, design docs, schemas, emails — and extracting structured product requirements. Be accurate. Never fabricate. Return only valid JSON.';

    const result = await callAI(prompt, systemPrompt);

    let fields = {};
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) fields = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse cowork AI response:', e);
      fields = {};
    }

    // Filter to only empty target fields and normalize response format
    const validFields = {};
    const fieldSources = {};
    for (const key of Object.keys(targetFields)) {
      if (fields[key] && (isFieldEmpty(currentFormData[key]))) {
        if (typeof fields[key] === 'object' && fields[key].value) {
          validFields[key] = fields[key].value;
          fieldSources[key] = fields[key].sourceFile || 'Unknown';
        } else if (typeof fields[key] === 'string') {
          validFields[key] = fields[key];
          fieldSources[key] = 'Unknown';
        }
      }
    }

    const relevantCount = Object.keys(validFields).length;

    res.json({
      success: true,
      data: {
        fields: validFields,
        fieldSources,
        relevantCount,
        scannedCount: scannedFiles.length,
        scannedFiles: matchedFiles
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate UI preview templates based on app concept and platform
router.post('/generate-ui-templates', async (req, res, next) => {
  try {
    const { appName, appIdea, platform, targetAudienceDemography, numberOfUsers, appStructure, selectedTechStack } = req.body;

    const platformStr = (platform || []).join(', ') || 'Web App';
    const audienceStr = (targetAudienceDemography || []).join(', ') || 'general users';
    const defaultScreen = appStructure?.defaultScreen || '';
    const workingScreen = appStructure?.workingScreen || '';
    const otherScreens = appStructure?.otherScreens || '';

    const prompt = `Generate exactly 3 UI preview templates for an application with these details:

App Name: ${appName || 'Untitled App'}
App Idea: ${appIdea || 'Not specified'}
Platform: ${platformStr}
Target Audience: ${audienceStr}
Expected Users: ${numberOfUsers || 'Not specified'}
Default Screen: ${defaultScreen || 'Not specified'}
Working Screen: ${workingScreen || 'Not specified'}
Other Screens: ${otherScreens || 'Not specified'}

For each template, provide:
1. templateName: A creative, descriptive name (e.g., "Executive Dashboard Pro", "Minimal Kanban Workspace")
2. layoutType: One of these exact values: "dashboard", "kanban", "landing", "mobile", "admin", "analytics"
3. screens: Array of 3 screen objects, each with:
   - name: Screen name
   - type: One of "hero", "dashboard", "list", "detail", "form", "settings", "analytics", "kanban", "chat", "profile", "calendar", "table"
   - sections: Array of 3-5 section descriptions (brief, 5-10 words each)
4. components: Array of 5-7 primary UI components used (e.g., "Sidebar Navigation", "Data Cards Grid", "Search Bar", "Status Badges")
5. bestFit: One sentence explaining why this template suits the app (max 120 chars)
6. colorAccent: A suggested accent style: "cool" (blues/greens), "warm" (oranges/reds), or "neutral" (grays/slate)
7. imageQueries: Array of exactly 3 short image search keywords (1-2 words each) that visually represent the app's domain and purpose. These will be used to fetch relevant stock photos. Examples: for a fitness app use ["fitness workout", "healthy food", "running athlete"], for a project management tool use ["team workspace", "kanban board", "office meeting"]. Make them specific and visual.

Make each template distinctly different in layout approach. One should be data-heavy, one should be clean/minimal, and one should be feature-rich. Ensure they match the platform type (mobile layouts for mobile apps, admin panels for enterprise, etc.).

Return ONLY valid JSON in this exact format:
{
  "templates": [
    {
      "templateName": "...",
      "layoutType": "...",
      "screens": [
        { "name": "...", "type": "...", "sections": ["...", "...", "..."] }
      ],
      "components": ["...", "..."],
      "bestFit": "...",
      "colorAccent": "cool",
      "imageQueries": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

    const result = await callAI(prompt, 'You are a senior UI/UX designer. Return only valid JSON, no markdown or explanation.');

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    res.json({ success: true, data: parsed.templates || parsed });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
