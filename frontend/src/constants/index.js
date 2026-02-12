// PRD Generator Constants

export const STEPS = [
  { id: 0, title: 'App Concept & Scope', subtitle: 'Define your vision', icon: 'Sparkles', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' },
  { id: 1, title: 'Platform & Tech Stack', subtitle: 'Choose your foundation', icon: 'Rocket', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' },
  { id: 2, title: 'Visual Style Guide', subtitle: "Define your application's complete visual identity", icon: 'Palette', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' },
  { id: 3, title: 'Generate PRD', subtitle: 'Create & Deploy', icon: 'FileText', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' }
];

export const DEMOGRAPHY_OPTIONS = ['Enterprise', 'SMBs', 'Startups', 'Students', 'Professionals', 'Women', 'Men', 'Seniors', 'Teenagers', 'Freelancers', 'Developers', 'Designers', 'Managers'];

export const GEOGRAPHY_OPTIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Africa', 'Australia', 'India', 'Southeast Asia', 'Global'];

export const FONT_OPTIONS = ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Calibri', 'Arial', 'Helvetica'];

export const PLATFORM_OPTIONS = [
  // Row 1
  { name: 'PWA', emoji: '🚀', sub: 'Progressive' },
  { name: 'Web App', emoji: '💻', sub: 'Browser' },
  { name: 'Mobile App', emoji: '📱', sub: 'iOS & Android' },
  { name: 'Chatbot', emoji: '🤖', sub: 'Conversational' },
  // Row 2
  { name: 'Website', emoji: '🌐', sub: 'Static/CMS' },
  { name: 'WP Plugin', emoji: '⚡', sub: 'WordPress' },
  { name: 'Report Builder', emoji: '📊', sub: 'Data & Reports' },
  { name: 'Chrome Extension', emoji: '🔌', sub: 'Browser Ext' },
  // Row 3
  { name: 'ML', emoji: '📈', sub: 'Machine Learning' },
  { name: 'Microservices', emoji: '🧩', sub: 'Backend' },
  { name: 'AI Agents', emoji: '🧠', sub: 'Autonomous' },
  { name: 'MCP / APIs', emoji: '🔗', sub: 'Integrations' }
];

export const APP_IDEA_TEMPLATE = `[App Name] is a [platform type] designed for [target audience] to [primary function].

Key Features:
• [Feature 1]: [Brief description]
• [Feature 2]: [Brief description]
• [Feature 3]: [Brief description]

Problem Solved: [Main pain point addressed]
Success Metric: [How success will be measured]`;

export const ISTVON_SECTIONS = [
  {
    id: 'instructions',
    letter: 'I',
    title: 'Instructions',
    borderClass: 'border-orange-200',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-600',
    headerClass: 'text-orange-800',
    fields: [
      { key: 'level', label: 'Level', placeholder: 'e.g., Lead Architect / Product Visionary' },
      { key: 'persona', label: 'Persona', placeholder: 'e.g., DigiBull System Builder using Opus 4.5' },
      { key: 'goal', label: 'Goal', placeholder: 'e.g., Build a functional, aesthetic app' },
      { key: 'background', label: 'Background', placeholder: 'e.g., Enterprise-grade with clean layout' }
    ]
  },
  {
    id: 'source',
    letter: 'S',
    title: 'Source',
    borderClass: 'border-blue-200',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-600',
    headerClass: 'text-blue-800',
    fields: [
      { key: 'sourceFiles', label: 'Source Files', placeholder: 'e.g., Interview notes, core purpose docs' },
      { key: 'externalLinks', label: 'External Links', placeholder: 'e.g., Blueprint standards, references' },
      { key: 'trained', label: 'ML/Trained Data', placeholder: 'e.g., Opus 4.5 reasoning models' }
    ]
  },
  {
    id: 'tools',
    letter: 'T',
    title: 'Tools',
    borderClass: 'border-green-200',
    bgClass: 'bg-green-100',
    textClass: 'text-green-600',
    headerClass: 'text-green-800',
    fields: [
      { key: 'language', label: 'Language', placeholder: 'e.g., React/Vite or Next.js' },
      { key: 'libraries', label: 'Libraries', placeholder: 'e.g., Tailwind CSS, Framer Motion, Lucide' },
      { key: 'api', label: 'API', placeholder: 'e.g., Multi-tenant API logic' }
    ]
  },
  {
    id: 'variables',
    letter: 'V',
    title: 'Variables',
    borderClass: 'border-purple-200',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-600',
    headerClass: 'text-purple-800',
    fields: [
      { key: 'tables', label: 'Tables', placeholder: 'e.g., Users, Tenants, Roles' },
      { key: 'weights', label: 'Weights', placeholder: 'e.g., Emphasize interaction rhythm' },
      { key: 'biases', label: 'Biases', placeholder: 'e.g., Prefer simple & clean' },
      { key: 'outputLength', label: 'Output Length', placeholder: 'e.g., Minimal documentation' }
    ]
  },
  {
    id: 'outcome',
    letter: 'O',
    title: 'Outcome',
    borderClass: 'border-teal-200',
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-600',
    headerClass: 'text-teal-800',
    fields: [
      { key: 'pipeType', label: 'Deliverables', placeholder: 'e.g., Functional App Build + Admin sections' },
      { key: 'keyMetrics', label: 'Key Metrics', placeholder: 'e.g., Vibe-alignment, smoothness' },
      { key: 'codeBlock', label: 'Code Format', placeholder: 'e.g., Vibe-coded components' },
      { key: 'quality', label: 'Quality', placeholder: 'e.g., Functional, aesthetic, aligned' }
    ]
  },
  {
    id: 'notification',
    letter: 'N',
    title: 'Notification',
    borderClass: 'border-red-200',
    bgClass: 'bg-red-100',
    textClass: 'text-red-600',
    headerClass: 'text-red-800',
    fields: [
      { key: 'clarification', label: 'Clarification', placeholder: 'e.g., Mandatory interview phase' },
      { key: 'exploration', label: 'Exploration', placeholder: 'e.g., Add optional enhancements' },
      { key: 'app', label: 'Channel', placeholder: 'e.g., Walk-through and dashboard preview' }
    ]
  }
];

export const PRD_PROMPT_TEMPLATE = `Build the [App Name] app using the DigiBull AI Coding System...

I - Instructions: [Level, Persona, Goal, Background]
S - Source: [Source Files, External Links, Trained Data]
T - Tools: [Language, Libraries, API]
V - Variables: [Tables, Weights, Biases, Output Length]
O - Outcome: [Deliverables, Key Metrics, Code Format, Quality]
N - Notification: [Clarification, Exploration, Channel]`;

export const DEFAULT_PRD_PROMPT = `Build the app using the BuLLM Coding System guiding the creative logic & generating the Product Requirements Document. Start by interviewing me about the core purpose of the app, the audience, and the enterprise taste. Use reasoning to translate that learning into features, flows, & interface decisions. Create the full app structure including pages, components, user flows, multi-tenant with admin data handling, & interaction rhythm. Keep the design simple, clean, and practical. Include sections for Home, Primary Feature, Admin panels, and any custom screens based on the app idea. Use clear naming, smooth transitions, and a layout that reflects the chosen vibe. Add enhancements such as AI input, automated recommendations, or a personalized dashboard. Make the final product functional, aesthetic, and aligned with the emotional tone I choose besides creating a simple walk-through of the app. Finally add requisite documentation for product support & troubleshooting the app.`;

export const PROPOSAL_TEMPLATES = {
  coverLetter: { name: 'Email Cover Letter', description: 'Summary with tentative commercials suitable for email' },
  salesProposal: { name: 'Standard Sales Proposal', description: 'Professional sales proposal with executive summary, challenges, solution, pricing & next steps' }
};

export const PRD_REVIEW_CHECKLIST = [
  { id: 'executive_summary', label: 'Executive Summary reviewed', category: 'Overview', checkField: 'appIdea', prdSearch: 'Executive Summary' },
  { id: 'product_vision', label: 'Product Vision aligned', category: 'Strategy', checkField: 'goal', prdSearch: 'Product Vision' },
  { id: 'problem_statement', label: 'Problem Statement validated', category: 'Overview', checkField: 'problemStatement', prdSearch: 'Problem Statement' },
  { id: 'target_users', label: 'Target Users & Personas defined', category: 'Users', checkField: 'targetAudienceDemography', prdSearch: 'Target Users' },
  { id: 'solution_overview', label: 'Solution Overview reviewed', category: 'Approach', checkField: 'appStructure', prdSearch: 'Solution Overview' },
  { id: 'user_stories', label: 'User Stories validated', category: 'Requirements', checkField: 'appStructure', prdSearch: 'User Stories' },
  { id: 'feature_requirements', label: 'Feature Requirements detailed', category: 'Features', checkField: 'appStructure', prdSearch: 'Feature Requirements' },
  { id: 'acceptance_criteria', label: 'Acceptance Criteria defined', category: 'Quality', checkField: 'goal', prdSearch: 'Acceptance Criteria' },
  { id: 'ui_wireframes', label: 'UI/Wireframes reviewed', category: 'Design', checkField: 'primaryColor', prdSearch: 'UI' },
  { id: 'nonfunctional_requirements', label: 'Non-Functional Requirements captured', category: 'Quality', checkField: 'platform', prdSearch: 'Non-Functional' },
  { id: 'tech_stack', label: 'Technology Stack confirmed', category: 'Technical', checkField: 'selectedTechStack', prdSearch: 'Technology Stack' },
  { id: 'tech_architecture', label: 'Technical Architecture reviewed', category: 'Technical', checkField: 'selectedTechStack', prdSearch: 'Technical Architecture' },
  { id: 'success_metrics', label: 'Success Metrics & KPIs set', category: 'Metrics', checkField: 'goal', prdSearch: 'Success Metrics' },
  { id: 'timeline', label: 'Timeline & Milestones approved', category: 'Planning', checkField: 'milestones', prdSearch: 'Timeline' },
  { id: 'risks_constraints', label: 'Risks, Constraints & Dependencies reviewed', category: 'Planning', checkField: 'outOfScope', prdSearch: 'Risks' },
  { id: 'open_questions', label: 'Open Questions documented', category: 'Planning', checkField: null, prdSearch: 'Open Questions' },
  { id: 'out_of_scope', label: 'Out of Scope items documented', category: 'Planning', checkField: 'outOfScope', prdSearch: 'Out of Scope' },
  { id: 'appendices', label: 'Appendices & references verified', category: 'Documentation', checkField: 'uploadedFiles', prdSearch: 'Appendix' }
];

export const DOCUMENT_CHECKLIST = [
  { id: 'app_idea', label: 'App Idea Doc', group: 1, keywords: ['idea', 'concept', 'vision', 'pitch', 'overview', 'brief', 'proposal', 'summary', 'about'] },
  { id: 'client_expectations', label: 'Client Expectations', group: 1, keywords: ['client', 'expectation', 'stakeholder', 'scope'] },
  { id: 'notebooklm', label: 'NotebookLM', group: 1, keywords: ['notebooklm', 'notebook', 'nlm'] },
  { id: 'storm_pdf', label: 'STORM PDF', group: 1, keywords: ['storm', 'storm pdf'] },
  { id: 'competitive_tools', label: 'Competitive Apps', group: 1, keywords: ['competitor', 'competition', 'competitive', 'market', 'benchmark', 'comparison', 'landscape'] },
  { id: 'process_flow', label: 'Proposed Process Flow', group: 1, keywords: ['flow', 'process', 'journey', 'workflow', 'diagram', 'wireframe', 'sitemap', 'navigation', 'ux', 'ui'] },
  { id: 'design_doc', label: 'Software Design Doc', group: 2, keywords: ['design', 'sdd', 'srs', 'brd', 'frd', 'functional', 'software design', 'spec', 'requirement'] },
  { id: 'integrations_3p', label: '3rd Party Integrations', group: 2, keywords: ['3rd party', 'third party', 'external', 'plugin', 'addon'] },
  { id: 'apis', label: 'APIs', group: 2, keywords: ['api', 'endpoint', 'rest', 'graphql', 'swagger', 'openapi'] },
  { id: 'mcps', label: 'MCPs', group: 2, keywords: ['mcp', 'model context'] },
  { id: 'data_schema', label: 'Data Schema', group: 2, keywords: ['schema', 'data', 'database', 'erd', 'model', 'entity', 'table', 'sql', 'migration'] },
  { id: 'legacy_code', label: 'Legacy Code', group: 2, keywords: ['legacy', 'code', 'source', 'codebase', 'repo'] },
  { id: 'hw_requirements', label: 'HW Requirements', group: 2, keywords: ['hardware', 'hw', 'device', 'iot', 'sensor', 'embedded', 'peripheral'] },
  { id: 'video_walkthrough', label: 'Video Walkthrough', group: 3, keywords: ['video', 'walkthrough', 'demo', 'recording', 'screencast', 'mp4', 'mov', 'webm'] },
  { id: 'screenshots', label: 'Screenshots', group: 3, keywords: ['screenshot', 'screen', 'capture', 'snapshot', 'existing tool', 'png', 'jpg', 'jpeg'] }
];

export const TECH_STACK_OPTIONS = {
  frontend: ['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Remix', 'Astro', 'Nuxt.js', 'Solid.js', 'Qwik'],
  css: ['Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI', 'Styled Components', 'Ant Design', 'Sass/SCSS', 'CSS Modules', 'Shadcn UI'],
  backend: ['Node.js/Express', 'Python/FastAPI', 'Python/Django', 'Ruby on Rails', 'Go', 'Java/Spring', '.NET', 'Supabase', 'Firebase', 'NestJS', 'Rust/Actix'],
  llm: ['Claude Opus', 'Claude Sonnet', 'GPT-4o', 'GPT-4o-mini', 'Gemini Pro', 'Llama 3', 'Mistral', 'Grok', 'DeepSeek', 'Cohere'],
  mcp: ['Claude MCP', 'Filesystem MCP', 'GitHub MCP', 'Slack MCP', 'Database MCP', 'Web Search MCP', 'Brave MCP', 'Memory MCP'],
  testing: ['Jest', 'Playwright', 'Cypress', 'Vitest', 'Mocha', 'Selenium', 'Puppeteer', 'Testing Library', 'Storybook', 'Postman'],
  deployment: ['Docker', 'AWS', 'Vercel', 'Netlify', 'Google Cloud', 'Azure', 'Railway', 'Fly.io', 'DigitalOcean', 'Heroku', 'Cloudflare'],
  reporting: ['Zoho Analytics', 'Metabase', 'Grafana', 'Power BI', 'Tableau', 'Apache Superset', 'Looker', 'Redash'],
  apis: ['Stripe', 'Twilio', 'SendGrid', 'Auth0', 'Firebase Auth', 'Cloudinary', 'Mapbox', 'OpenAI API', 'Anthropic API', 'AWS S3'],
  localLlm: ['Ollama', 'LM Studio', 'llama.cpp', 'vLLM', 'GPT4All', 'Jan', 'LocalAI', 'Kobold.cpp'],
  evalTools: ['LangSmith', 'Weights & Biases', 'MLflow', 'Arize', 'Braintrust', 'Promptfoo', 'Humanloop', 'Langfuse'],
  additional: ['n8n', 'Zapier', 'Redis', 'PostgreSQL', 'MongoDB', 'Elasticsearch', 'RabbitMQ', 'Kafka', 'GraphQL', 'Prisma']
};

export const HELP_TEXTS = {
  appName: 'Enter a concise, memorable name for your application. This will be used throughout all documentation and branding materials. Keep it under 50 characters for optimal readability.',
  appIdea: 'Provide a brief description of your application concept. Focus on the core value proposition and primary use case. Maximum 100 characters to ensure clarity.',
  problemStatement: 'Clearly articulate the specific problems or pain points your application will address. Be specific about user challenges, inefficiencies, or gaps in existing solutions. Good problem statements are measurable and focused.',
  goal: 'Define the primary objective of your application. Include specific, measurable success criteria such as "reduce processing time by 50%" or "improve user satisfaction to 4.5/5 rating".',
  demography: 'Select up to 3 demographic segments that best represent your target users. Consider factors like job role, industry, experience level, and organizational size.',
  geography: 'Choose up to 3 geographical regions where your application will be primarily used. This helps with localization, compliance, and market strategy planning.',
  outOfScope: 'List features, functionality, or requirements that are explicitly excluded from version 1.0. This helps manage stakeholder expectations and maintain project focus.',
  documents: 'Upload supporting documents to provide context for PRD generation. Documents are optional but recommended for comprehensive PRD creation. Accepted formats include PDFs, Word docs, Excel spreadsheets, images, and videos.',
  platform: 'Select the primary platform for your application. This choice influences technical architecture, development approach, and deployment strategy.',
  appStructure: 'Define the main navigation and screen structure of your application. Default Screen is the first screen users see, Working Screen is where primary tasks occur, and Other Screens include settings, profiles, etc.',
  techStack: 'Specify your preferred technologies across all layers of the application stack. Consider factors like team expertise, scalability requirements, and ecosystem maturity.',
  competitors: 'Identify 3 main competitors or alternative solutions. AI will analyze their strengths and weaknesses to help position your product effectively in the market.',
  logo: 'Upload your primary logo in vector format (SVG) for best quality, or high-resolution PNG/JPG. Secondary logo/icon is used for favicons, app icons, and small spaces.',
  photos: 'Upload brand photography or stock images that represent your brand aesthetic. These will guide the visual direction of your application.',
  colors: 'Select brand colors that will be used consistently throughout your application. The system checks WCAG contrast ratios to ensure accessibility compliance.',
  typography: 'Choose fonts for body text and headings. Body font should be highly readable, while heading font can be more distinctive. Ensure both fonts support all required character sets.',
  headingSizes: 'Define font sizes for each heading level and body text. Maintain a clear typographic hierarchy with sufficient size difference between levels.',
  charts: 'Define your data visualization color palette and styling guidelines. Consistent chart styling improves user comprehension and brand recognition.',
  images: 'Set standards for image treatment including border radius, aspect ratios, and quality requirements. Consistent image styling creates a cohesive visual experience.',
  timeline: 'Set project deadlines and define key milestones. Include deliverables, review points, and critical path items. Clear timelines help coordinate team efforts.',
  prdReview: 'Systematically review each section of your PRD to ensure completeness and accuracy. Check all checkboxes to confirm each area has been thoroughly reviewed.',
  proposal: 'Choose a proposal template that matches your client type and project scope. Each template emphasizes different aspects of the project.',
  export: 'Export your PRD in the format that best suits your workflow. PDF for sharing, DOC for collaborative editing, JSON for programmatic access.'
};

export const INITIAL_FORM_DATA = {
  appName: '',
  appIdea: '',
  useTemplate: false,
  prdPromptTemplate: '',
  istvonData: {
    level: '', persona: '', goal: '', background: '',
    sourceFiles: '', externalLinks: '', trained: '',
    language: '', libraries: '', api: '',
    tables: '', weights: '', biases: '', outputLength: '',
    pipeType: '', keyMetrics: '', codeBlock: '', quality: '',
    clarification: '', exploration: '', app: ''
  },
  problemStatement: '',
  goal: '',
  targetAudienceDemography: [],
  targetAudienceGeography: [],
  outOfScope: '',
  uploadedFiles: [],
  uploadedPhotos: [],
  documentChecklist: {},
  googleDriveLink: '',
  oneDriveLink: '',
  zipFiles: [],
  platform: [],
  numberOfUsers: '',
  numberOfAdmins: '',
  appStructure: { defaultScreen: '', workingScreen: '', otherScreens: '' },
  usePreviousTechStack: false,
  selectedTechStack: {
    frontend: [], css: [], backend: [], llm: [], mcp: [], testing: [],
    deployment: [], reporting: [], additional: [], apis: [], localLlm: [], evalTools: []
  },
  competitors: [
    { name: '', url: '', analysis: '' },
    { name: '', url: '', analysis: '' },
    { name: '', url: '', analysis: '' }
  ],
  primaryColor: '#0093B6',
  secondaryColor: '#0093B6',
  accentColor: '#009688',
  primaryLogo: null,
  secondaryLogo: null,
  primaryFont: 'Inter',
  headingsFont: 'Poppins',
  h1Size: '48px',
  h2Size: '36px',
  h3Size: '24px',
  h4Size: '20px',
  h5Size: '18px',
  bodySize: '16px',
  chartColor1: '#0093B6',
  chartColor2: '#0093B6',
  chartColor3: '#009688',
  chartColor4: '#F59E0B',
  chartColor5: '#EF4444',
  chartGuidelines: '',
  imageStyles: [],
  imageGuidelines: '',
  imageBorderRadius: '8px',
  imageAspectRatio: '16:9',
  imageQuality: '1920x1080',
  generatedPRD: '',
  assignedTeam: [],
  dueDate: '',
  milestones: [],
  projectType: '',
  prdVersion: '1.0',
  proposalTemplate: 'standard',
  coverLetter: ''
};

export const STORAGE_KEYS = {
  FORM_DATA: 'prd_form_data',
  API_KEY: 'prd_ai_api_key',
  API_PROVIDER: 'prd_ai_provider',
  PREVIOUS_TECH_STACK: 'prd_previous_tech_stack'
};
