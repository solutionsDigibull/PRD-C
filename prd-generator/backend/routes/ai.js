const express = require('express');
const router = express.Router();

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

// Recommend APIs
router.post('/recommend-apis', async (req, res, next) => {
  try {
    const { appName, appIdea, platform, techStack } = req.body;

    const prompt = `For a ${platform} called "${appName}" that "${appIdea}" with tech stack: ${JSON.stringify(techStack)}

Recommend:
1. Essential APIs (payment, email, SMS, etc.)
2. MCP (Model Context Protocol) integrations if relevant

Format your response as:
APIS: [comma-separated list of recommended APIs]
MCP: [comma-separated list of MCP integrations]

Be specific with API names (e.g., "Stripe API" not just "payment API").`;

    const response = await callAI(prompt);

    // Parse the response
    const apisMatch = response.match(/APIS:\s*(.+)/i);
    const mcpMatch = response.match(/MCP:\s*(.+)/i);

    res.json({
      success: true,
      data: {
        apis: apisMatch ? apisMatch[1].trim() : '',
        mcp: mcpMatch ? mcpMatch[1].trim() : ''
      }
    });
  } catch (error) {
    next(error);
  }
});

// Discover competitors
router.post('/discover-competitors', async (req, res, next) => {
  try {
    const { appName, appIdea, targetAudience } = req.body;

    const prompt = `Find and analyze 3 main competitors for a product called "${appName}" that "${appIdea}" targeting ${(targetAudience || []).join(', ') || 'general users'}.

For each competitor, provide:
1. Company/Product Name
2. Website URL (use real URLs)
3. Brief analysis: their strengths and your opportunity to differentiate

Format as JSON array:
[
  {"name": "Competitor Name", "url": "https://competitor.com", "analysis": "Their strength. Your opportunity."},
  ...
]

Return only the JSON array, no other text.`;

    const response = await callAI(prompt);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const competitors = JSON.parse(jsonMatch[0]);
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
**Platform:** ${formData.platform}

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
${Object.entries(formData.selectedTechStack || {}).filter(([k, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

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
- Platform: ${formData.platform}
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
- Platform: ${formData.platform}
- Tech Stack: ${Object.entries(formData.selectedTechStack || {}).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}
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

module.exports = router;
