// AI Service for PRD Generator
// Calls backend API which handles OpenAI/Claude integration

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/ai';

// Helper: delay for retry backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AIService {
  constructor() {
    this.isReady = false;
    this.provider = 'openai';
    this.apiBaseUrl = API_BASE_URL;
  }

  // Resolve the effective API base URL (handles relative paths)
  getEffectiveUrl(endpoint) {
    return `${this.apiBaseUrl}${endpoint}`;
  }

  // Check if backend is configured — with retry and fallback
  async checkStatus() {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1500;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Primary: try /api/ai/status
        const response = await fetch(this.getEffectiveUrl('/status'), {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const data = await response.json();
          this.isReady = data.configured;
          this.provider = data.provider;
          return data;
        }

        // Non-OK response — try /api/health as fallback
        try {
          const healthUrl = this.apiBaseUrl.replace(/\/api\/ai\/?$/, '/api/health');
          const healthResp = await fetch(healthUrl, {
            signal: AbortSignal.timeout(5000),
          });
          if (healthResp.ok) {
            const healthData = await healthResp.json();
            this.isReady = healthData.configured;
            this.provider = healthData.provider;
            return healthData;
          }
        } catch (_) {
          // health fallback failed, continue to retry
        }

        return { configured: false, provider: 'openai' };
      } catch (error) {
        console.warn(`Backend status check attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }

        // All retries exhausted — return error with details
        const errorDetail =
          error.name === 'TimeoutError'
            ? 'Request timed out'
            : error.name === 'TypeError'
              ? 'Network error — backend may be unreachable'
              : error.message;

        console.error('Backend status check failed after all retries:', errorDetail);
        return {
          configured: false,
          provider: 'openai',
          error: 'Backend not running',
          errorDetail,
          apiUrl: this.apiBaseUrl,
        };
      }
    }

    return { configured: false, provider: 'openai', error: 'Backend not running' };
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

  // === Auto-Population Endpoints (19) ===

  async generateUserPersonas(appName, appIdea, demographics) {
    return this.callBackend('/generate-user-personas', { appName, appIdea, demographics });
  }

  async generateUserStories(appName, appIdea, platform, audience) {
    return this.callBackend('/generate-user-stories', { appName, appIdea, platform, audience });
  }

  async generateUserJourney(appName, appIdea, platform) {
    return this.callBackend('/generate-user-journey', { appName, appIdea, platform });
  }

  async generateMVPFeatures(appName, appIdea, platform, audience) {
    return this.callBackend('/generate-mvp-features', { appName, appIdea, platform, audience });
  }

  async generateSuccessMetrics(appName, appIdea, audience, numberOfUsers) {
    return this.callBackend('/generate-success-metrics', { appName, appIdea, audience, numberOfUsers });
  }

  async generateNavArchitecture(appStructure, platform, appName) {
    return this.callBackend('/generate-nav-architecture', { appStructure, platform, appName });
  }

  async generateTechJustifications(selectedTechStack, appName, platform, numberOfUsers) {
    return this.callBackend('/generate-tech-justifications', { selectedTechStack, appName, platform, numberOfUsers });
  }

  async generateDatabaseArchitecture(appName, appIdea, platform, techStack) {
    return this.callBackend('/generate-database-architecture', { appName, appIdea, platform, techStack });
  }

  async generateSecurityCompliance(appName, audience, platform) {
    return this.callBackend('/generate-security-compliance', { appName, audience, platform });
  }

  async generatePerformanceTargets(numberOfUsers, platform, appName) {
    return this.callBackend('/generate-performance-targets', { numberOfUsers, platform, appName });
  }

  async generateCompetitivePositioning(competitors, appName, appIdea) {
    return this.callBackend('/generate-competitive-positioning', { competitors, appName, appIdea });
  }

  async generateDesignSystem(colors, fonts, platform) {
    return this.callBackend('/generate-design-system', { colors, fonts, platform });
  }

  async generateUXGuidelines(platform, audience, appName) {
    return this.callBackend('/generate-ux-guidelines', { platform, audience, appName });
  }

  async generateDevPhases(appName, features, platform, techStack) {
    return this.callBackend('/generate-dev-phases', { appName, features, platform, techStack });
  }

  async generateImplementationRoadmap(devPhases, techStack, teamSize) {
    return this.callBackend('/generate-implementation-roadmap', { devPhases, techStack, teamSize });
  }

  async generateTestingStrategy(platform, techStack, appName) {
    return this.callBackend('/generate-testing-strategy', { platform, techStack, appName });
  }

  async generateDeploymentStrategy(platform, techStack, deployment) {
    return this.callBackend('/generate-deployment-strategy', { platform, techStack, deployment });
  }

  async generateDocumentationPlan(appName, techStack, platform) {
    return this.callBackend('/generate-documentation-plan', { appName, techStack, platform });
  }

  async generateBudgetEstimation(appName, techStack, timeline, teamSize, platform) {
    return this.callBackend('/generate-budget-estimation', { appName, techStack, timeline, teamSize, platform });
  }

  // === Validation Endpoints (4) ===

  async validateTechStack(selectedTechStack) {
    return this.callBackend('/validate-tech-stack', { selectedTechStack });
  }

  async validateTimeline(milestones, features, teamSize) {
    return this.callBackend('/validate-timeline', { milestones, features, teamSize });
  }

  async validateBudget(budgetEstimates, features, timeline) {
    return this.callBackend('/validate-budget', { budgetEstimates, features, timeline });
  }

  async validateDependencies(formData) {
    return this.callBackend('/validate-dependencies', { formData });
  }
}

// Export singleton instance
export const aiService = new AIService();
export default AIService;
