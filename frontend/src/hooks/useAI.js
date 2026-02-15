// Custom hook for AI functionality

import { useState, useCallback, useEffect } from 'react';
import { aiService } from '../services/aiService';

/**
 * Custom hook for AI-powered features
 * @returns {object} AI state and methods
 */
export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [statusErrorDetail, setStatusErrorDetail] = useState(null);

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus('checking');
      const status = await aiService.checkStatus();
      setIsConfigured(status.configured);
      setProvider(status.provider);
      setStatusErrorDetail(status.errorDetail || null);
      setBackendStatus(status.error ? 'error' : (status.configured ? 'ready' : 'not_configured'));
    };
    checkBackend();
  }, []);

  // Wrapper for AI calls with error handling
  const executeAI = useCallback(async (aiFunction) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await aiFunction();
      setIsProcessing(false);
      return { success: true, data: result };
    } catch (err) {
      setIsProcessing(false);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Enhance problem statement
  const enhanceProblemStatement = useCallback(async (currentText, appName, appIdea) => {
    return executeAI(() => aiService.enhanceProblemStatement(currentText, appName, appIdea));
  }, [executeAI]);

  // Enhance goal
  const enhanceGoal = useCallback(async (currentText, appName, problemStatement) => {
    return executeAI(() => aiService.enhanceGoal(currentText, appName, problemStatement));
  }, [executeAI]);

  // Suggest out of scope
  const suggestOutOfScope = useCallback(async (appName, appIdea, platform) => {
    return executeAI(() => aiService.suggestOutOfScope(appName, appIdea, platform));
  }, [executeAI]);

  // Recommend APIs
  const recommendAPIs = useCallback(async (appName, appIdea, platform, techStack) => {
    return executeAI(() => aiService.recommendAPIs(appName, appIdea, platform, techStack));
  }, [executeAI]);

  // Discover competitors
  const discoverCompetitors = useCallback(async (appName, appIdea, targetAudience) => {
    return executeAI(() => aiService.discoverCompetitors(appName, appIdea, targetAudience));
  }, [executeAI]);

  // Discover competitor pain points from review sites
  const discoverCompetitorPainpoints = useCallback(async (competitorName, appName, appIdea) => {
    return executeAI(() => aiService.discoverCompetitorPainpoints(competitorName, appName, appIdea));
  }, [executeAI]);

  // Suggest chart guidelines
  const suggestChartGuidelines = useCallback(async (primaryColor, secondaryColor) => {
    return executeAI(() => aiService.suggestChartGuidelines(primaryColor, secondaryColor));
  }, [executeAI]);

  // Suggest image guidelines
  const suggestImageGuidelines = useCallback(async (borderRadius, aspectRatio) => {
    return executeAI(() => aiService.suggestImageGuidelines(borderRadius, aspectRatio));
  }, [executeAI]);

  // Generate full PRD
  const generatePRD = useCallback(async (formData) => {
    return executeAI(() => aiService.generatePRD(formData));
  }, [executeAI]);

  // Generate proposal cover letter
  const generateProposalCoverLetter = useCallback(async (formData, templateType) => {
    return executeAI(() => aiService.generateProposalCoverLetter(formData, templateType));
  }, [executeAI]);

  // Enhance PRD prompt
  const enhancePrdPrompt = useCallback(async (currentPrompt, appName, appIdea) => {
    return executeAI(() => aiService.enhancePrdPrompt(currentPrompt, appName, appIdea));
  }, [executeAI]);

  // Analyze uploaded files for auto-fill
  const analyzeUploadedFiles = useCallback(async (files, currentFormData) => {
    return executeAI(() => aiService.analyzeUploadedFiles(files, currentFormData));
  }, [executeAI]);

  // Analyze a cloud drive link for auto-fill
  const analyzeDriveLink = useCallback(async (url, source, currentFormData) => {
    return executeAI(() => aiService.analyzeDriveLink(url, source, currentFormData));
  }, [executeAI]);

  // Claude Cowork: scan all sources and analyze
  const coworkFetch = useCallback(async (payload) => {
    return executeAI(() => aiService.coworkFetch(payload));
  }, [executeAI]);

  // Generate UI preview templates
  const generateUITemplates = useCallback(async (appName, appIdea, platform, targetAudienceDemography, numberOfUsers, appStructure, selectedTechStack) => {
    return executeAI(() => aiService.generateUITemplates(appName, appIdea, platform, targetAudienceDemography, numberOfUsers, appStructure, selectedTechStack));
  }, [executeAI]);

  // === Auto-Population Methods (19) ===

  const generateUserPersonas = useCallback(async (appName, appIdea, demographics) => {
    return executeAI(() => aiService.generateUserPersonas(appName, appIdea, demographics));
  }, [executeAI]);

  const generateUserStories = useCallback(async (appName, appIdea, platform, audience) => {
    return executeAI(() => aiService.generateUserStories(appName, appIdea, platform, audience));
  }, [executeAI]);

  const generateUserJourney = useCallback(async (appName, appIdea, platform) => {
    return executeAI(() => aiService.generateUserJourney(appName, appIdea, platform));
  }, [executeAI]);

  const generateMVPFeatures = useCallback(async (appName, appIdea, platform, audience) => {
    return executeAI(() => aiService.generateMVPFeatures(appName, appIdea, platform, audience));
  }, [executeAI]);

  const generateSuccessMetrics = useCallback(async (appName, appIdea, audience, numberOfUsers) => {
    return executeAI(() => aiService.generateSuccessMetrics(appName, appIdea, audience, numberOfUsers));
  }, [executeAI]);

  const generateNavArchitecture = useCallback(async (appStructure, platform, appName) => {
    return executeAI(() => aiService.generateNavArchitecture(appStructure, platform, appName));
  }, [executeAI]);

  const generateTechJustifications = useCallback(async (selectedTechStack, appName, platform, numberOfUsers) => {
    return executeAI(() => aiService.generateTechJustifications(selectedTechStack, appName, platform, numberOfUsers));
  }, [executeAI]);

  const generateDatabaseArchitecture = useCallback(async (appName, appIdea, platform, techStack) => {
    return executeAI(() => aiService.generateDatabaseArchitecture(appName, appIdea, platform, techStack));
  }, [executeAI]);

  const generateSecurityCompliance = useCallback(async (appName, audience, platform) => {
    return executeAI(() => aiService.generateSecurityCompliance(appName, audience, platform));
  }, [executeAI]);

  const generatePerformanceTargets = useCallback(async (numberOfUsers, platform, appName) => {
    return executeAI(() => aiService.generatePerformanceTargets(numberOfUsers, platform, appName));
  }, [executeAI]);

  const generateCompetitivePositioning = useCallback(async (competitors, appName, appIdea) => {
    return executeAI(() => aiService.generateCompetitivePositioning(competitors, appName, appIdea));
  }, [executeAI]);

  const generateDesignSystem = useCallback(async (colors, fonts, platform) => {
    return executeAI(() => aiService.generateDesignSystem(colors, fonts, platform));
  }, [executeAI]);

  const generateUXGuidelines = useCallback(async (platform, audience, appName) => {
    return executeAI(() => aiService.generateUXGuidelines(platform, audience, appName));
  }, [executeAI]);

  const generateDevPhases = useCallback(async (appName, features, platform, techStack) => {
    return executeAI(() => aiService.generateDevPhases(appName, features, platform, techStack));
  }, [executeAI]);

  const generateImplementationRoadmap = useCallback(async (devPhases, techStack, teamSize) => {
    return executeAI(() => aiService.generateImplementationRoadmap(devPhases, techStack, teamSize));
  }, [executeAI]);

  const generateTestingStrategy = useCallback(async (platform, techStack, appName) => {
    return executeAI(() => aiService.generateTestingStrategy(platform, techStack, appName));
  }, [executeAI]);

  const generateDeploymentStrategy = useCallback(async (platform, techStack, deployment) => {
    return executeAI(() => aiService.generateDeploymentStrategy(platform, techStack, deployment));
  }, [executeAI]);

  const generateDocumentationPlan = useCallback(async (appName, techStack, platform) => {
    return executeAI(() => aiService.generateDocumentationPlan(appName, techStack, platform));
  }, [executeAI]);

  const generateBudgetEstimation = useCallback(async (appName, techStack, timeline, teamSize, platform) => {
    return executeAI(() => aiService.generateBudgetEstimation(appName, techStack, timeline, teamSize, platform));
  }, [executeAI]);

  // === Validation Methods (4) ===

  const validateTechStack = useCallback(async (selectedTechStack) => {
    return executeAI(() => aiService.validateTechStack(selectedTechStack));
  }, [executeAI]);

  const validateTimeline = useCallback(async (milestones, features, teamSize) => {
    return executeAI(() => aiService.validateTimeline(milestones, features, teamSize));
  }, [executeAI]);

  const validateBudget = useCallback(async (budgetEstimates, features, timeline) => {
    return executeAI(() => aiService.validateBudget(budgetEstimates, features, timeline));
  }, [executeAI]);

  const validateDependencies = useCallback(async (formData) => {
    return executeAI(() => aiService.validateDependencies(formData));
  }, [executeAI]);

  // Refresh backend status
  const refreshStatus = useCallback(async () => {
    setBackendStatus('checking');
    const status = await aiService.checkStatus();
    setIsConfigured(status.configured);
    setProvider(status.provider);
    setStatusErrorDetail(status.errorDetail || null);
    setBackendStatus(status.error ? 'error' : (status.configured ? 'ready' : 'not_configured'));
    return status;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isProcessing,
    error,
    isConfigured,
    provider,
    backendStatus,
    statusErrorDetail,

    // AI Methods (existing)
    enhanceProblemStatement,
    enhanceGoal,
    suggestOutOfScope,
    recommendAPIs,
    discoverCompetitors,
    discoverCompetitorPainpoints,
    suggestChartGuidelines,
    suggestImageGuidelines,
    generatePRD,
    generateProposalCoverLetter,
    enhancePrdPrompt,
    analyzeUploadedFiles,
    analyzeDriveLink,
    coworkFetch,
    generateUITemplates,

    // Auto-Population Methods (19)
    generateUserPersonas,
    generateUserStories,
    generateUserJourney,
    generateMVPFeatures,
    generateSuccessMetrics,
    generateNavArchitecture,
    generateTechJustifications,
    generateDatabaseArchitecture,
    generateSecurityCompliance,
    generatePerformanceTargets,
    generateCompetitivePositioning,
    generateDesignSystem,
    generateUXGuidelines,
    generateDevPhases,
    generateImplementationRoadmap,
    generateTestingStrategy,
    generateDeploymentStrategy,
    generateDocumentationPlan,
    generateBudgetEstimation,

    // Validation Methods (4)
    validateTechStack,
    validateTimeline,
    validateBudget,
    validateDependencies,

    // Utilities
    clearError,
    refreshStatus
  };
};

export default useAI;
