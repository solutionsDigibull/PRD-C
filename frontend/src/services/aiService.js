// AI Service for PRD Generator
// Calls backend API which handles OpenAI/Claude integration

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/ai';

class AIService {
  constructor() {
    this.isReady = false;
    this.provider = 'openai';
  }

  // Check if backend is configured
  async checkStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      if (response.ok) {
        const data = await response.json();
        this.isReady = data.configured;
        this.provider = data.provider;
        return data;
      }
      return { configured: false, provider: 'openai' };
    } catch (error) {
      console.error('Backend status check failed:', error);
      return { configured: false, provider: 'openai', error: 'Backend not running' };
    }
  }

  isConfigured() {
    return this.isReady;
  }

  getProvider() {
    return this.provider;
  }

  // Generic API call helper
  async callBackend(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  }

  // Enhance problem statement
  async enhanceProblemStatement(currentText, appName, appIdea) {
    return this.callBackend('/enhance-problem', { currentText, appName, appIdea });
  }

  // Enhance goal
  async enhanceGoal(currentText, appName, problemStatement) {
    return this.callBackend('/enhance-goal', { currentText, appName, problemStatement });
  }

  // Suggest out of scope items
  async suggestOutOfScope(appName, appIdea, platform) {
    return this.callBackend('/suggest-out-of-scope', { appName, appIdea, platform });
  }

  // Recommend APIs based on project
  async recommendAPIs(appName, appIdea, platform, techStack) {
    return this.callBackend('/recommend-apis', { appName, appIdea, platform, techStack });
  }

  // Discover and analyze competitors
  async discoverCompetitors(appName, appIdea, targetAudience) {
    return this.callBackend('/discover-competitors', { appName, appIdea, targetAudience });
  }

  // Discover competitor pain points from review sites
  async discoverCompetitorPainpoints(competitorName, appName, appIdea) {
    return this.callBackend('/discover-competitor-painpoints', { competitorName, appName, appIdea });
  }

  // Suggest chart guidelines
  async suggestChartGuidelines(primaryColor, secondaryColor) {
    return this.callBackend('/suggest-chart-guidelines', { primaryColor, secondaryColor });
  }

  // Suggest image guidelines
  async suggestImageGuidelines(borderRadius, aspectRatio) {
    return this.callBackend('/suggest-image-guidelines', { borderRadius, aspectRatio });
  }

  // Generate full PRD
  async generatePRD(formData) {
    return this.callBackend('/generate-prd', { formData });
  }

  // Generate proposal cover letter
  async generateProposalCoverLetter(formData, templateType) {
    return this.callBackend('/generate-proposal', { formData, templateType });
  }

  // Enhance PRD prompt
  async enhancePrdPrompt(currentPrompt, appName, appIdea) {
    return this.callBackend('/enhance-prd-prompt', { currentPrompt, appName, appIdea });
  }

  // Analyze uploaded files for auto-fill
  async analyzeUploadedFiles(files, currentFormData) {
    return this.callBackend('/analyze-files', { files, currentFormData });
  }

  // Analyze a cloud drive link for auto-fill
  async analyzeDriveLink(url, source, currentFormData) {
    return this.callBackend('/analyze-link', { url, source, currentFormData });
  }

  // Claude Cowork: scan all sources and analyze
  async coworkFetch(payload) {
    return this.callBackend('/cowork-fetch', payload);
  }

  // Generate UI preview templates
  async generateUITemplates(appName, appIdea, platform, targetAudienceDemography, numberOfUsers, appStructure, selectedTechStack) {
    return this.callBackend('/generate-ui-templates', { appName, appIdea, platform, targetAudienceDemography, numberOfUsers, appStructure, selectedTechStack });
  }
}

// Export singleton instance
export const aiService = new AIService();
export default AIService;
