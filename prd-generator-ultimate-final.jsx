import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Rocket, Palette, FileText, Wand2, Upload, Check, X, Save, Search, Link, FolderArchive, Users, Send, HelpCircle, Download, Camera, Eye, CheckCircle2, FileCheck } from 'lucide-react';

export default function PRDGeneratorFinal() {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  const [showMappedChecklist, setShowMappedChecklist] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [formData, setFormData] = useState({
    appName: '',
    appIdea: '',
    useTemplate: false,
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
    platform: '',
    appStructure: { defaultScreen: '', workingScreen: '', otherScreens: '' },
    usePreviousTechStack: false,
    selectedTechStack: {
      frontend: '', css: '', backend: '', llm: '', mcp: '', testing: '',
      deployment: '', reporting: '', additional: '', apis: '', localLlm: '', evalTools: ''
    },
    competitors: [
      { name: '', url: '', analysis: '' },
      { name: '', url: '', analysis: '' },
      { name: '', url: '', analysis: '' }
    ],
    primaryColor: '#FD9B00',
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
    chartColor1: '#FD9B00',
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
  });

  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [demographySearch, setDemographySearch] = useState('');
  const [geographySearch, setGeographySearch] = useState('');
  const [showDemographyDropdown, setShowDemographyDropdown] = useState(false);
  const [showGeographyDropdown, setShowGeographyDropdown] = useState(false);
  const [prdReviewComplete, setPrdReviewComplete] = useState(false);
  const [proposalGenerated, setProposalGenerated] = useState(false);

  const steps = [
    { id: 0, title: 'App Concept & Scope', subtitle: 'Define your vision', icon: Sparkles, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', color: '#FD9B00' },
    { id: 1, title: 'Platform & Tech Stack', subtitle: 'Choose your foundation', icon: Rocket, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' },
    { id: 2, title: 'Visual Style Guide', subtitle: 'Build your brand', icon: Palette, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', color: '#FD9B00' },
    { id: 3, title: 'Generate PRD', subtitle: 'Create & Deploy', icon: FileText, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', color: '#0093B6' }
  ];

  const demographyOptions = ['Enterprise', 'SMBs', 'Startups', 'Students', 'Professionals', 'Women', 'Men', 'Seniors', 'Teenagers', 'Freelancers', 'Developers', 'Designers', 'Managers'];
  const geographyOptions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Africa', 'Australia', 'India', 'Southeast Asia', 'Global'];
  const fontOptions = ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Calibri', 'Arial', 'Helvetica'];

  const appIdeaTemplate = `[App Name] is a [platform type] designed for [target audience] to [primary function]. 

Key Features:
• [Feature 1]: [Brief description]
• [Feature 2]: [Brief description]  
• [Feature 3]: [Brief description]

Problem Solved: [Main pain point addressed]
Success Metric: [How success will be measured]`;

  const proposalTemplates = {
    standard: { name: 'Standard Business Proposal', description: 'Professional proposal for enterprise clients' },
    technical: { name: 'Technical Implementation Proposal', description: 'Detailed technical proposal for development teams' },
    executive: { name: 'Executive Summary Proposal', description: 'High-level proposal for C-suite executives' }
  };

  const prdReviewChecklist = [
    { id: 'executive_summary', label: 'Executive Summary reviewed', category: 'Overview' },
    { id: 'problem_statement', label: 'Problem Statement validated', category: 'Overview' },
    { id: 'target_users', label: 'Target Users & Personas defined', category: 'Users' },
    { id: 'feature_requirements', label: 'Feature Requirements detailed', category: 'Features' },
    { id: 'tech_stack', label: 'Technology Stack confirmed', category: 'Technical' },
    { id: 'success_metrics', label: 'Success Metrics & KPIs set', category: 'Metrics' },
    { id: 'timeline', label: 'Timeline & Milestones approved', category: 'Planning' },
    { id: 'out_of_scope', label: 'Out of Scope items documented', category: 'Planning' }
  ];

  const helpTexts = {
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

  useEffect(() => {
    const autoSave = setTimeout(() => saveFormData(), 3000);
    return () => clearTimeout(autoSave);
  }, [formData]);

  const saveFormData = () => {
    setAutoSaveStatus('saving');
    localStorage.setItem('prd_form_data', JSON.stringify(formData));
    setTimeout(() => setAutoSaveStatus('saved'), 500);
  };

  const saveAndContinue = () => {
    saveFormData();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    alert('Progress saved successfully!');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAutoSaveStatus('unsaved');
  };

  const handleTemplateApply = () => {
    const filledTemplate = appIdeaTemplate
      .replace('[App Name]', formData.appName || 'Your App')
      .replace('[platform type]', formData.platform || 'application')
      .replace('[target audience]', formData.targetAudienceDemography[0] || 'users')
      .replace('[primary function]', 'solve specific problems');
    
    handleInputChange('appIdea', filledTemplate.substring(0, 1000));
    setShowTemplateDialog(false);
  };

  const addDemography = (option) => {
    if (formData.targetAudienceDemography.length < 3 && !formData.targetAudienceDemography.includes(option)) {
      handleInputChange('targetAudienceDemography', [...formData.targetAudienceDemography, option]);
    }
    setDemographySearch('');
    setShowDemographyDropdown(false);
  };

  const removeDemography = (option) => {
    handleInputChange('targetAudienceDemography', formData.targetAudienceDemography.filter(d => d !== option));
  };

  const addGeography = (option) => {
    if (formData.targetAudienceGeography.length < 3 && !formData.targetAudienceGeography.includes(option)) {
      handleInputChange('targetAudienceGeography', [...formData.targetAudienceGeography, option]);
    }
    setGeographySearch('');
    setShowGeographyDropdown(false);
  };

  const removeGeography = (option) => {
    handleInputChange('targetAudienceGeography', formData.targetAudienceGeography.filter(g => g !== option));
  };

  const filteredDemography = demographyOptions.filter(opt => 
    opt.toLowerCase().includes(demographySearch.toLowerCase()) &&
    !formData.targetAudienceDemography.includes(opt)
  );

  const filteredGeography = geographyOptions.filter(opt => 
    opt.toLowerCase().includes(geographySearch.toLowerCase()) &&
    !formData.targetAudienceGeography.includes(opt)
  );

  const handleFileUpload = (event, type = 'files') => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }));
    
    if (type === 'photos') {
      handleInputChange('uploadedPhotos', [...formData.uploadedPhotos, ...newFiles]);
    } else {
      handleInputChange('uploadedFiles', [...formData.uploadedFiles, ...newFiles]);
    }
  };

  const handleLogoUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange(type === 'primary' ? 'primaryLogo' : 'secondaryLogo', {
        name: file.name, size: file.size, type: file.type
      });
    }
  };

  const calculateContrast = (color1, color2) => {
    const getRGB = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const getLuminance = (rgb) => {
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const lum1 = getLuminance(getRGB(color1));
    const lum2 = getLuminance(getRGB(color2));
    const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    return contrast >= 4.5 ? 'PASS' : 'FAIL';
  };

  const aiEnhanceField = async (field) => {
    setAiEnhancing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const suggestions = {
      problemStatement: "Sales teams waste 4-6 hours per week on manual data entry, reducing selling time. Lack of intelligent prioritization leads to equal time spent on all leads, missing high-value opportunities.",
      goal: "Create an AI-powered CRM that automates routine tasks, provides predictive insights, and helps B2B teams close deals 50% faster while improving forecast accuracy by 35%",
      outOfScope: "• Native mobile apps (web-only for v1.0)\n• Marketing automation\n• Support ticketing\n• E-commerce integrations\n• Multi-language support\n• Custom reporting",
      chartGuidelines: "Use consistent color palette. Include clear legends and labels. Tooltips show precise values. Grid lines at 25% opacity. Round corners on bar charts (4px radius).",
      imageGuidelines: "Maintain 16:9 aspect ratio. Apply 8px border radius. Use subtle drop shadows (0 2px 8px rgba(0,0,0,0.1)). Compress to under 200KB. Prefer WebP format."
    };
    setPendingChanges({ field, originalValue: formData[field], newValue: suggestions[field] || formData[field] });
    setShowUndoDialog(true);
    setAiEnhancing(false);
  };

  const aiRecommendAPIs = async () => {
    setAiEnhancing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    handleInputChange('selectedTechStack', {
      ...formData.selectedTechStack,
      apis: 'Stripe API, SendGrid, Twilio, Google Maps API',
      mcp: 'Claude MCP, GitHub MCP, Supabase MCP'
    });
    setAiEnhancing(false);
  };

  const aiDiscoverCompetitors = async () => {
    setAiEnhancing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockCompetitors = [
      { name: 'Salesforce CRM', url: 'https://salesforce.com', analysis: 'Complex enterprise solution. Opportunity: Simpler onboarding, better mobile UX, affordable SMB pricing.' },
      { name: 'HubSpot', url: 'https://hubspot.com', analysis: 'Strong marketing automation. Opportunity: Better sales features, advanced AI scoring.' },
      { name: 'Pipedrive', url: 'https://pipedrive.com', analysis: 'Visual pipeline focus. Opportunity: AI insights, automated workflows.' }
    ];
    handleInputChange('competitors', mockCompetitors);
    setAiEnhancing(false);
  };

  const acceptAiChanges = () => {
    if (pendingChanges.field) {
      handleInputChange(pendingChanges.field, pendingChanges.newValue);
    }
    setShowUndoDialog(false);
    setPendingChanges({});
  };

  const updateCompetitor = (index, field, value) => {
    const newCompetitors = [...formData.competitors];
    newCompetitors[index] = { ...newCompetitors[index], [field]: value };
    handleInputChange('competitors', newCompetitors);
  };

  const addMilestone = () => {
    handleInputChange('milestones', [...formData.milestones, { id: Date.now(), name: '', date: '', description: '' }]);
  };

  const updateMilestone = (id, field, value) => {
    handleInputChange('milestones', formData.milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMilestone = (id) => {
    handleInputChange('milestones', formData.milestones.filter(m => m.id !== id));
  };

  const generatePRD = async () => {
    setAiEnhancing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockPRD = `# Product Requirements Document
**${formData.appName || 'Application'}**
**Version:** ${formData.prdVersion}  |  **Date:** ${new Date().toLocaleDateString()}

---

## 1. Executive Summary
${formData.appIdea}

## 2. Product Vision
${formData.goal}

## 3. Target Users
**Demographics:** ${formData.targetAudienceDemography.join(', ')}
**Geography:** ${formData.targetAudienceGeography.join(', ')}

## 4. Problem Statement
${formData.problemStatement}

## 5. Solution Overview
**Platform:** ${formData.platform}
**Technology Stack:** ${Object.values(formData.selectedTechStack).filter(Boolean).join(', ')}

## 6. App Structure
- **Default Screen:** ${formData.appStructure.defaultScreen}
- **Working Screen:** ${formData.appStructure.workingScreen}
- **Other Screens:** ${formData.appStructure.otherScreens}

## 7. Visual Design System
- **Primary Color:** ${formData.primaryColor}
- **Secondary Color:** ${formData.secondaryColor}
- **Primary Font:** ${formData.primaryFont}
- **Heading Font:** ${formData.headingsFont}

## 8. Competition Analysis
${formData.competitors.map((c, i) => `
**${c.name}**
- URL: ${c.url}
- Analysis: ${c.analysis}
`).join('\n')}

## 9. Out of Scope (v1.0)
${formData.outOfScope}

## 10. Timeline & Milestones
**Project Type:** ${formData.projectType}
**Due Date:** ${formData.dueDate}
**Milestones:**
${formData.milestones.map(m => `- ${m.name} (${m.date}): ${m.description}`).join('\n')}

---
*Powered by ISTVON PRD Prompt Framework*
*Generated using BuLLMake PRD Generator*`;

    handleInputChange('generatedPRD', mockPRD);
    setAiEnhancing(false);
    setPrdReviewComplete(false);
  };

  const generateProposal = async (template) => {
    setAiEnhancing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const coverLetters = {
      standard: `Dear [Client Name],

We are pleased to present this comprehensive proposal for developing ${formData.appName || 'your application'}.

Our team has carefully reviewed your requirements and designed a solution that addresses your core business needs while maintaining flexibility for future growth.

We look forward to partnering with you on this exciting project.

Best regards,
[Your Company]`,
      technical: `Technical Implementation Proposal
Project: ${formData.appName}

This proposal outlines the technical architecture, development approach, and implementation roadmap for your application.

Our team brings expertise in ${formData.selectedTechStack.frontend}, ${formData.selectedTechStack.backend}, and modern DevOps practices.`,
      executive: `Executive Summary
${formData.appName} - Strategic Initiative

This proposal presents a strategic overview of the project, expected business impact, and investment requirements.

Key Benefits:
• ${formData.goal}
• Competitive differentiation
• Measurable ROI`
    };

    const proposal = `${coverLetters[template]}

${formData.generatedPRD}

---
*Powered by ISTVON PRD Prompt Framework*`;
    
    const blob = new Blob([proposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposal-${template}-${Date.now()}.txt`;
    a.click();
    
    setProposalGenerated(true);
    setAiEnhancing(false);
  };

  const exportPRD = (format) => {
    const prdWithWatermark = formData.generatedPRD + '\n\n---\nPowered by ISTVON PRD Prompt Framework';
    const blob = new Blob([prdWithWatermark], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRD-${formData.appName || 'App'}-${Date.now()}.${format}`;
    a.click();
  };

  const HelpTooltip = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <HelpCircle size={16} className="text-gray-400 hover:text-orange-600 cursor-help transition-colors" />
      <div className="invisible group-hover:visible absolute z-50 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-2xl -top-2 left-6 leading-relaxed">
        {text}
        <div className="absolute top-3 -left-1.5 w-3 h-3 bg-gray-900 transform rotate-45"></div>
      </div>
    </div>
  );

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      saveFormData();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            {/* DigiBull Logo */}
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <div className="inline-block">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-orange-500">Digi</span>
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-amber-500 to-blue-400 rounded transform rotate-45"></div>
                    <span className="text-4xl font-black text-blue-500">BuLL.ai</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">AI-Powered Business Solutions</div>
                </div>
              </div>
            </div>

            {/* App Name + App Idea */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-base font-bold text-gray-800">
                    <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                    App Name
                    <HelpTooltip text={helpTexts.appName} />
                  </label>
                  <span className="text-sm text-gray-500">{formData.appName.length}/50</span>
                </div>
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => e.target.value.length <= 50 && handleInputChange('appName', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="App name..."
                />
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-base font-bold text-gray-800">
                    App Idea (Max 100 chars)
                    <HelpTooltip text={helpTexts.appIdea} />
                  </label>
                  <span className="text-sm text-gray-500">{formData.appIdea.length}/100</span>
                </div>
                <input
                  type="text"
                  value={formData.appIdea}
                  onChange={(e) => e.target.value.length <= 100 && handleInputChange('appIdea', e.target.value)}
                  className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="Brief description..."
                />
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200">
                <h4 className="font-bold text-orange-900 mb-3 flex items-center text-sm">
                  <FileText size={16} className="mr-2" />
                  Template
                </h4>
                <button
                  onClick={() => setShowTemplateDialog(true)}
                  className="w-full px-4 py-2 bg-white text-orange-700 font-semibold rounded-lg hover:bg-orange-100 transition-all border-2 border-orange-300 text-sm"
                >
                  Use Template
                </button>
              </div>
            </div>

            {/* Problem Statement */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-base font-bold text-gray-800">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Problem Statement
                  <HelpTooltip text={helpTexts.problemStatement} />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => aiEnhanceField('problemStatement')}
                    disabled={aiEnhancing}
                    className="flex items-center px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-all"
                  >
                    <Wand2 size={14} className="mr-2" />
                    AI Enhance
                  </button>
                  <button
                    onClick={() => aiEnhanceField('problemStatement')}
                    disabled={aiEnhancing}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    <Sparkles size={14} className="mr-2" />
                    AI Suggest
                  </button>
                </div>
              </div>
              <textarea
                value={formData.problemStatement}
                onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none"
                rows="5"
                placeholder="Describe the problems your app will solve..."
              />
            </div>

            {/* Goal */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-base font-bold text-gray-800">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Main Goal
                  <HelpTooltip text={helpTexts.goal} />
                </label>
                <button
                  onClick={() => aiEnhanceField('goal')}
                  disabled={aiEnhancing}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  <Wand2 size={16} className="mr-2" />
                  AI Suggest
                </button>
              </div>
              <textarea
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none"
                rows="3"
                placeholder="Define the primary objective..."
              />
            </div>

            {/* Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-base font-bold text-gray-800 mb-3">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Target Demography (Max 3)
                  <HelpTooltip text={helpTexts.demography} />
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.targetAudienceDemography.map(demo => (
                    <span key={demo} className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                      {demo}
                      <button onClick={() => removeDemography(demo)} className="ml-2 hover:text-orange-200">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {formData.targetAudienceDemography.length < 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={demographySearch}
                      onChange={(e) => setDemographySearch(e.target.value)}
                      onFocus={() => setShowDemographyDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-400 outline-none"
                      placeholder="Search..."
                    />
                    {showDemographyDropdown && filteredDemography.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredDemography.map(opt => (
                          <button
                            key={opt}
                            onClick={() => addDemography(opt)}
                            className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center text-base font-bold text-gray-800 mb-3">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5</span>
                  Target Geography (Max 3)
                  <HelpTooltip text={helpTexts.geography} />
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.targetAudienceGeography.map(geo => (
                    <span key={geo} className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                      {geo}
                      <button onClick={() => removeGeography(geo)} className="ml-2 hover:text-orange-200">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {formData.targetAudienceGeography.length < 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={geographySearch}
                      onChange={(e) => setGeographySearch(e.target.value)}
                      onFocus={() => setShowGeographyDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-400 outline-none"
                      placeholder="Search..."
                    />
                    {showGeographyDropdown && filteredGeography.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredGeography.map(opt => (
                          <button
                            key={opt}
                            onClick={() => addGeography(opt)}
                            className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Out of Scope */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-base font-bold text-gray-800">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
                  Out of Scope (v1.0)
                  <HelpTooltip text={helpTexts.outOfScope} />
                </label>
                <button
                  onClick={() => aiEnhanceField('outOfScope')}
                  disabled={aiEnhancing}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  <Wand2 size={16} className="mr-2" />
                  AI Suggest
                </button>
              </div>
              <textarea
                value={formData.outOfScope}
                onChange={(e) => handleInputChange('outOfScope', e.target.value)}
                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none"
                rows="4"
                placeholder="Features excluded from v1.0..."
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">7</span>
                Upload Documents
                <HelpTooltip text={helpTexts.documents} />
              </label>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowPrepChecklist(!showPrepChecklist)}
                  className="px-4 py-2 bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200 transition-all text-sm"
                >
                  📋 Preparation Checklist
                </button>
                <button
                  onClick={() => setShowMappedChecklist(!showMappedChecklist)}
                  className="px-4 py-2 bg-teal-100 text-teal-700 font-semibold rounded-lg hover:bg-teal-200 transition-all text-sm"
                >
                  ✓ Upload Status
                </button>
              </div>

              {showPrepChecklist && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 mb-6">
                  <h4 className="font-bold text-orange-900 mb-3">Preparation Checklist</h4>
                  <p className="text-sm text-orange-700 mb-3">Documents to prepare before starting:</p>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-center"><Check size={16} className="mr-2 text-orange-600" />App Idea Document</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-orange-600" />Legacy PRD or Design Document</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-orange-600" />Process Flow Diagrams</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-orange-600" />Data Schema</li>
                    <li className="flex items-center"><Check size={16} className="mr-2 text-orange-600" />Competitor Analysis</li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all">
                  <FolderArchive size={32} className="text-gray-400 mb-2" />
                  <span className="font-medium text-gray-700 text-sm">Upload as ZIP</span>
                  <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" />
                </label>

                <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="font-medium text-gray-700 text-sm">Upload Multiple Files</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" multiple />
                </label>

                <div className="relative">
                  <Link className="absolute left-3 top-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.googleDriveLink}
                    onChange={(e) => handleInputChange('googleDriveLink', e.target.value)}
                    className="w-full h-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-sm"
                    placeholder="Google Drive link"
                  />
                </div>

                <div className="relative">
                  <Link className="absolute left-3 top-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.oneDriveLink}
                    onChange={(e) => handleInputChange('oneDriveLink', e.target.value)}
                    className="w-full h-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-sm"
                    placeholder="OneDrive link"
                  />
                </div>
              </div>

              {formData.uploadedFiles.length > 0 && (
                <div className="bg-orange-50 rounded-xl border-2 border-orange-200 p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">
                    Uploaded: {formData.uploadedFiles.length} files
                  </h4>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {formData.uploadedFiles.map((file) => (
                      <div key={file.id} className="text-xs bg-white p-2 rounded truncate">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            {/* Platform Type - 2x4 Grid */}
            <div>
              <label className="flex items-center text-lg font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                Select Platform Type
                <HelpTooltip text={helpTexts.platform} />
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Mobile App', emoji: '📱', sub: 'iOS & Android' },
                  { name: 'Web App', emoji: '💻', sub: 'Browser' },
                  { name: 'PWA', emoji: '🚀', sub: 'Progressive' },
                  { name: 'Desktop', emoji: '🖥️', sub: 'Win/Mac' },
                  { name: 'Website', emoji: '🌐', sub: 'WordPress' },
                  { name: 'Chrome Extension', emoji: '🔌', sub: 'Browser Ext' },
                  { name: 'WordPress Plugin', emoji: '⚡', sub: 'WP Plugin' },
                  { name: 'Other', emoji: '📦', sub: 'Custom' }
                ].map((option) => (
                  <button
                    key={option.name}
                    onClick={() => handleInputChange('platform', option.name)}
                    className={`px-4 py-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      formData.platform === option.name
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">{option.emoji}</div>
                    <div className={formData.platform === option.name ? 'text-blue-700' : 'text-gray-700'}>
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{option.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* App Structure */}
            <div>
              <label className="flex items-center text-lg font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                App Structure
                <HelpTooltip text={helpTexts.appStructure} />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🏠 Default Screen</label>
                  <input
                    type="text"
                    value={formData.appStructure.defaultScreen}
                    onChange={(e) => handleInputChange('appStructure', {...formData.appStructure, defaultScreen: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
                    placeholder="Home/Dashboard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Main Workspace</label>
                  <input
                    type="text"
                    value={formData.appStructure.workingScreen}
                    onChange={(e) => handleInputChange('appStructure', {...formData.appStructure, workingScreen: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
                    placeholder="Primary work area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Other Screens</label>
                  <input
                    type="text"
                    value={formData.appStructure.otherScreens}
                    onChange={(e) => handleInputChange('appStructure', {...formData.appStructure, otherScreens: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
                    placeholder="Settings, Profile..."
                  />
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-lg font-bold text-gray-800">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Technology Stack
                  <HelpTooltip text={helpTexts.techStack} />
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.usePreviousTechStack}
                      onChange={(e) => handleInputChange('usePreviousTechStack', e.target.checked)}
                      className="mr-2"
                    />
                    Use Previous Selection
                  </label>
                  <button
                    onClick={aiRecommendAPIs}
                    disabled={aiEnhancing}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    <Wand2 size={14} className="inline mr-2" />
                    AI Recommend
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'frontend', label: 'Frontend' },
                    { key: 'css', label: 'CSS Framework' },
                    { key: 'backend', label: 'Backend' }
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">{label}</h4>
                      <input
                        type="text"
                        value={formData.selectedTechStack[key]}
                        onChange={(e) => handleInputChange('selectedTechStack', {...formData.selectedTechStack, [key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder={`e.g., ${key === 'frontend' ? 'React' : key === 'css' ? 'Tailwind' : 'Supabase'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'llm', label: 'LLM Engine' },
                    { key: 'mcp', label: 'MCP Integrations' },
                    { key: 'testing', label: 'Testing' }
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">{label}</h4>
                      <input
                        type="text"
                        value={formData.selectedTechStack[key]}
                        onChange={(e) => handleInputChange('selectedTechStack', {...formData.selectedTechStack, [key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder={`e.g., ${key === 'llm' ? 'Claude Opus' : key === 'mcp' ? 'Claude MCP' : 'Playwright'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'deployment', label: 'Deployment' },
                    { key: 'reporting', label: 'Enterprise Reporting' },
                    { key: 'apis', label: 'APIs' }
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">{label}</h4>
                      <input
                        type="text"
                        value={formData.selectedTechStack[key]}
                        onChange={(e) => handleInputChange('selectedTechStack', {...formData.selectedTechStack, [key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder={`e.g., ${key === 'deployment' ? 'Docker, AWS' : key === 'reporting' ? 'Zoho' : 'Stripe API'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'localLlm', label: 'Local LLM' },
                    { key: 'evalTools', label: 'Eval Tools' },
                    { key: 'additional', label: 'Additional Tools' }
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">{label}</h4>
                      <input
                        type="text"
                        value={formData.selectedTechStack[key]}
                        onChange={(e) => handleInputChange('selectedTechStack', {...formData.selectedTechStack, [key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder={`e.g., ${key === 'localLlm' ? 'Ollama' : key === 'evalTools' ? 'LangSmith' : 'n8n'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Competitor Discovery */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-lg font-bold text-blue-900">
                  <Sparkles size={20} className="mr-2" />
                  Competitor Discovery
                  <HelpTooltip text={helpTexts.competitors} />
                </label>
                <button
                  onClick={aiDiscoverCompetitors}
                  disabled={aiEnhancing}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  <Wand2 size={16} className="mr-2" />
                  Discover & Analyze
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.competitors.map((comp, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => updateCompetitor(idx, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
                        placeholder={`Competitor ${idx + 1}`}
                      />
                      <input
                        type="text"
                        value={comp.url}
                        onChange={(e) => updateCompetitor(idx, 'url', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="URL"
                      />
                    </div>
                    <textarea
                      value={comp.analysis}
                      onChange={(e) => updateCompetitor(idx, 'analysis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                      rows="2"
                      placeholder="Analysis..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Removed Visual Style Guide intro box per image reference */}
            <div className="border-b-2 border-orange-200 pb-4 mb-6">
              <h3 className="text-2xl font-bold text-orange-900">Visual Style Guide</h3>
              <p className="text-orange-700 text-sm mt-1">Define your application's complete visual identity</p>
            </div>

            {/* Complete Style Preview - Moved to Top */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Complete Style Preview</div>
              <div className="space-y-6">
                <div>
                  <h1 style={{ fontFamily: formData.headingsFont, fontSize: formData.h1Size }} className="font-bold text-gray-900 mb-2">
                    Heading 1 Example
                  </h1>
                  <h2 style={{ fontFamily: formData.headingsFont, fontSize: formData.h2Size }} className="font-bold text-gray-800 mb-2">
                    Heading 2 Example
                  </h2>
                  <p style={{ fontFamily: formData.primaryFont, fontSize: formData.bodySize }} className="text-gray-600 leading-relaxed">
                    This is body text using your selected typography with all styles applied.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: formData.primaryColor }}>
                    Primary
                  </button>
                  <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: formData.secondaryColor }}>
                    Secondary
                  </button>
                  <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: formData.accentColor }}>
                    Accent
                  </button>
                </div>
              </div>
            </div>

            {/* Logo & Photographs - Same Row */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                Logo & Brand Photography
                <HelpTooltip text={helpTexts.logo} />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 transition-all">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="font-medium text-gray-700 text-sm mb-1">Primary Logo</span>
                  <span className="text-xs text-gray-500">SVG, PNG, JPG</span>
                  <input type="file" accept=".svg,.png,.jpg" onChange={(e) => handleLogoUpload(e, 'primary')} className="hidden" />
                </label>
                
                <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 transition-all">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="font-medium text-gray-700 text-sm mb-1">Secondary/Icon</span>
                  <span className="text-xs text-gray-500">For favicons</span>
                  <input type="file" accept=".svg,.png,.jpg,.ico" onChange={(e) => handleLogoUpload(e, 'secondary')} className="hidden" />
                </label>

                <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 transition-all">
                  <Camera size={32} className="text-gray-400 mb-2" />
                  <span className="font-medium text-gray-700 text-sm mb-1">Photographs</span>
                  <span className="text-xs text-gray-500">Brand images</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" multiple />
                </label>
              </div>
              {formData.uploadedPhotos.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  {formData.uploadedPhotos.length} photo(s) uploaded
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                Color Palette
                <HelpTooltip text={helpTexts.colors} />
              </label>
              <div className="space-y-4">
                {[
                  { label: 'Primary Color', key: 'primaryColor' },
                  { label: 'Secondary Color', key: 'secondaryColor' },
                  { label: 'Accent Color', key: 'accentColor' }
                ].map(({ label, key }) => (
                  <div key={key} className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold text-gray-800">{label}</div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="h-12 w-12 rounded-lg cursor-pointer border-2"
                        />
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono font-semibold uppercase"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative p-3 rounded-lg" style={{ backgroundColor: formData[key] }}>
                        <div className="text-white text-sm font-medium">White Text</div>
                        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${
                          calculateContrast(formData[key], '#FFFFFF') === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {calculateContrast(formData[key], '#FFFFFF')}
                        </div>
                      </div>
                      <div className="relative p-3 rounded-lg" style={{ backgroundColor: formData[key] }}>
                        <div className="text-black text-sm font-medium">Black Text</div>
                        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${
                          calculateContrast(formData[key], '#000000') === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {calculateContrast(formData[key], '#000000')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                Typography
                <HelpTooltip text={helpTexts.typography} />
              </label>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200">
                  <label className="block text-sm font-bold text-orange-900 mb-3">Body Font</label>
                  <select
                    value={formData.primaryFont}
                    onChange={(e) => handleInputChange('primaryFont', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-lg outline-none"
                  >
                    {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                  <label className="block text-sm font-bold text-blue-900 mb-3">Heading Font</label>
                  <select
                    value={formData.headingsFont}
                    onChange={(e) => handleInputChange('headingsFont', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-lg outline-none"
                  >
                    {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Heading Styles - With Previews */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
                Heading Styles
                <HelpTooltip text={helpTexts.headingSizes} />
              </label>
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { level: 'H1', key: 'h1Size', usage: 'Page titles' },
                    { level: 'H2', key: 'h2Size', usage: 'Section headers' },
                    { level: 'H3', key: 'h3Size', usage: 'Subsections' },
                    { level: 'H4', key: 'h4Size', usage: 'Card titles' },
                    { level: 'H5', key: 'h5Size', usage: 'Small headings' },
                    { level: 'Body', key: 'bodySize', usage: 'Paragraph text' }
                  ].map(({ level, key, usage }) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{level}</div>
                          <div className="text-xs text-gray-500">{usage}</div>
                        </div>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-20 px-3 py-1 border border-gray-300 rounded text-sm text-center"
                        />
                      </div>
                      <div 
                        className="mt-2 p-2 bg-white rounded border border-gray-200"
                        style={{ 
                          fontFamily: level === 'Body' ? formData.primaryFont : formData.headingsFont,
                          fontSize: formData[key]
                        }}
                      >
                        <Eye size={14} className="inline mr-2 text-gray-400" />
                        Preview
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart & Data Visualization */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5</span>
                Chart & Data Visualization
                <HelpTooltip text={helpTexts.charts} />
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Chart Colors</label>
                  <div className="space-y-2">
                    {['chartColor1', 'chartColor2', 'chartColor3', 'chartColor4', 'chartColor5'].map((key, idx) => (
                      <div key={key} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-12">Color {idx + 1}</span>
                        <input
                          type="color"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Guidelines</label>
                      <button
                        onClick={() => aiEnhanceField('chartGuidelines')}
                        className="text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        AI Suggest
                      </button>
                    </div>
                    <textarea
                      value={formData.chartGuidelines}
                      onChange={(e) => handleInputChange('chartGuidelines', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs resize-none"
                      rows="2"
                      placeholder="Chart styling..."
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Sample Charts</div>
                  <div className="space-y-4">
                    <div className="flex items-end justify-around h-24 border-b border-gray-200">
                      {[60, 80, 45, 90, 70].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-10 rounded-t"
                          style={{ height: `${height}%`, backgroundColor: formData[`chartColor${idx + 1}`] }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90">
                        {[0, 72, 144, 216, 288].map((start, idx) => (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={formData[`chartColor${idx + 1}`]}
                            strokeWidth="20"
                            strokeDasharray={`${72} 251.2`}
                            strokeDashoffset={-start}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image & Photography */}
            <div>
              <label className="flex items-center text-base font-bold text-gray-800 mb-4">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
                Image & Photography Guidelines
                <HelpTooltip text={helpTexts.images} />
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Border Radius', key: 'imageBorderRadius' },
                      { label: 'Aspect Ratio', key: 'imageAspectRatio' },
                      { label: 'Min Quality', key: 'imageQuality' }
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Image Treatment</label>
                    <button
                      onClick={() => aiEnhanceField('imageGuidelines')}
                      className="text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      AI Suggest
                    </button>
                  </div>
                  <textarea
                    value={formData.imageGuidelines}
                    onChange={(e) => handleInputChange('imageGuidelines', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs resize-none"
                    rows="5"
                    placeholder="Shadows, filters, compression..."
                  />
                </div>

                <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Visual Examples</div>
                  <div className="grid grid-cols-2 gap-3">
                    {['from-orange-200 to-amber-300', 'from-blue-200 to-cyan-300', 'from-purple-200 to-pink-300', 'from-green-200 to-teal-300'].map((gradient, idx) => (
                      <div 
                        key={idx}
                        className={`h-20 bg-gradient-to-br ${gradient}`}
                        style={{ borderRadius: formData.imageBorderRadius }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Border Radius: {formData.imageBorderRadius}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-2 flex items-center">
                Generate Product Requirements Document
                <HelpTooltip text="Review, generate, and distribute your comprehensive PRD following the ISTVON framework." />
              </h3>
              <p className="text-blue-700">Review inputs, generate PRD, create proposals, and deploy to your team</p>
            </div>

            {/* PRD Review Checklist */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                <FileCheck size={20} className="mr-2" />
                PRD Review Checklist
                <HelpTooltip text={helpTexts.prdReview} />
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {prdReviewChecklist.map(item => (
                  <label key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-500 rounded mr-3"
                      onChange={(e) => {
                        const allChecked = prdReviewChecklist.every(i => 
                          document.querySelector(`input[type="checkbox"][id="${i.id}"]`)?.checked
                        );
                        setPrdReviewComplete(allChecked);
                      }}
                      id={item.id}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  </label>
                ))}
              </div>
              {prdReviewComplete && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center">
                  <CheckCircle2 size={16} className="mr-2" />
                  PRD review complete! Ready to generate.
                </div>
              )}
            </div>

            {/* Process Flow */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-4">Next Steps</h4>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={generatePRD}
                  disabled={aiEnhancing}
                  className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all"
                >
                  <FileText size={32} className="mx-auto mb-3 text-blue-600" />
                  <div className="font-bold text-blue-900 mb-1">1. Generate PRD</div>
                  <div className="text-xs text-blue-700">Create comprehensive document</div>
                </button>

                <button
                  onClick={() => setShowTemplateDialog(true)}
                  disabled={!formData.generatedPRD}
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Send size={32} className="mx-auto mb-3 text-green-600" />
                  <div className="font-bold text-green-900 mb-1">2. Sales Proposal</div>
                  <div className="text-xs text-green-700">Convert to proposal</div>
                </button>

                <button
                  onClick={() => {}}
                  disabled={!formData.generatedPRD}
                  className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Download size={32} className="mx-auto mb-3 text-orange-600" />
                  <div className="font-bold text-orange-900 mb-1">3. Export</div>
                  <div className="text-xs text-orange-700">PDF, DOC, JSON</div>
                </button>
              </div>
            </div>

            {/* PRD Display */}
            {formData.generatedPRD && (
              <>
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 relative">
                  <div className="absolute top-4 right-4 text-xs text-gray-300 font-mono">
                    ISTVON PRD Framework
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {formData.generatedPRD}
                  </pre>
                </div>

                {/* Export Options */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Download size={20} className="mr-2" />
                    Export PRD
                    <HelpTooltip text={helpTexts.export} />
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => exportPRD('pdf')}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => exportPRD('docx')}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                    >
                      Export as DOC
                    </button>
                    <button
                      onClick={() => exportPRD('json')}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800"
                    >
                      Export as JSON
                    </button>
                  </div>
                </div>

                {/* Timeline & Milestones */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <label className="flex items-center text-lg font-bold text-gray-800 mb-4">
                    Timeline & Project Details
                    <HelpTooltip text={helpTexts.timeline} />
                  </label>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project Type</label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => handleInputChange('projectType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none"
                      >
                        <option value="">Select</option>
                        <option value="internal">Internal</option>
                        <option value="poc">POC</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addMilestone}
                        className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
                      >
                        Add Milestone
                      </button>
                    </div>
                  </div>

                  {formData.milestones.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700">Milestones</h4>
                      {formData.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                          <input
                            type="text"
                            value={milestone.name}
                            onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-200 rounded"
                            placeholder="Name"
                          />
                          <input
                            type="date"
                            value={milestone.date}
                            onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                            className="px-3 py-2 border border-blue-200 rounded"
                          />
                          <input
                            type="text"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-200 rounded"
                            placeholder="Description"
                          />
                          <button
                            onClick={() => removeMilestone(milestone.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Assignment */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Users size={20} className="mr-2" />
                    Assign to Development Team
                  </h4>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="email"
                      placeholder="Team member email"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleInputChange('assignedTeam', [...formData.assignedTeam, e.target.value]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  
                  {formData.assignedTeam.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.assignedTeam.map((email, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {email}
                          <button
                            onClick={() => handleInputChange('assignedTeam', formData.assignedTeam.filter((_, i) => i !== idx))}
                            className="ml-2 hover:text-blue-900"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => alert('PRD sent to: ' + formData.assignedTeam.join(', '))}
                    disabled={formData.assignedTeam.length === 0}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send size={20} className="mr-2" />
                    Send to Team
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${currentStepData.gradient} rounded-2xl shadow-2xl mb-6`}
          >
            <StepIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-3">
            PRD Generator
          </h1>
          <p className="text-xl text-gray-600 font-medium">Enterprise Application Builder</p>
          
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <Save size={14} className={autoSaveStatus === 'saved' ? 'text-green-500' : 'text-gray-400'} />
              <span className="text-sm text-gray-500">
                {autoSaveStatus === 'saving' && 'Saving...'}
                {autoSaveStatus === 'saved' && 'Saved'}
                {autoSaveStatus === 'unsaved' && 'Unsaved'}
              </span>
            </div>
            <button
              onClick={saveAndContinue}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Save & Continue
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex justify-center items-center space-x-3 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`transition-all duration-300 rounded-full ${
                index === currentStep
                  ? `w-12 h-3 bg-gradient-to-r ${step.gradient}`
                  : index < currentStep
                  ? 'w-3 h-3 bg-gray-400'
                  : 'w-3 h-3 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${currentStepData.gradient} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className={`${currentStepData.bg} px-8 py-6 border-b-2 border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
                <p className="text-gray-600 mt-1">{currentStepData.subtitle}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-500">STEP</div>
                <div className="text-3xl font-black" style={{ color: currentStepData.color }}>
                  {currentStep + 1}/{steps.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {renderStepContent()}
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`group flex items-center px-6 py-3 rounded-xl font-bold transition-all ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
                }`}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>

              {currentStep === steps.length - 1 ? (
                <div className="text-sm text-gray-600">
                  Final step - Generate and deploy
                </div>
              ) : (
                <button
                  onClick={nextStep}
                  className={`group flex items-center px-8 py-4 bg-gradient-to-r ${currentStepData.gradient} text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all`}
                >
                  Next Step
                  <ArrowRight size={22} className="ml-3" />
                </button>
              )}
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-600 font-medium">
              Powered by <span className="font-bold text-orange-600">BuLLM Coding System</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 font-medium">
            🚀 CRM • 💼 Quotation Tools • 📊 Project Management • 📝 Proposals
          </p>
        </div>
      </div>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                {formData.generatedPRD ? 'Select Proposal Template' : 'Use App Idea Template'}
              </h3>
            </div>
            <div className="p-6">
              {formData.generatedPRD ? (
                <div className="space-y-3">
                  {Object.entries(proposalTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => {
                        generateProposal(key);
                        setShowTemplateDialog(false);
                      }}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all"
                    >
                      <div className="font-bold text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs whitespace-pre-wrap">
                      {appIdeaTemplate}
                    </pre>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    This template will be filled with your app name and details (max 1000 characters).
                  </div>
                </>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              {!formData.generatedPRD && (
                <button
                  onClick={handleTemplateApply}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:shadow-lg"
                >
                  Apply Template
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Dialog */}
      {showUndoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Wand2 size={24} className="mr-3" />
                AI Enhancement Preview
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Original:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600">
                    {pendingChanges.originalValue || '(Empty)'}
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">AI Suggested:</h4>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {pendingChanges.newValue}
                  </pre>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={() => { setShowUndoDialog(false); setPendingChanges({}); }}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={acceptAiChanges}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:shadow-lg"
              >
                Accept Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
