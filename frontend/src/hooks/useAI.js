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

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus('checking');
      const status = await aiService.checkStatus();
      setIsConfigured(status.configured);
      setProvider(status.provider);
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

  // Refresh backend status
  const refreshStatus = useCallback(async () => {
    const status = await aiService.checkStatus();
    setIsConfigured(status.configured);
    setProvider(status.provider);
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

    // AI Methods
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

    // Utilities
    clearError,
    refreshStatus
  };
};

export default useAI;
