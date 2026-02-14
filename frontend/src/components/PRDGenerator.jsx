import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Rocket, Palette, FileText, Wand2, Upload, Check, X, Search, Link, FolderArchive, Users, Send, Info, Download, Camera, Eye, CheckCircle2, FileCheck, Settings, AlertCircle, Loader2, RefreshCw, FolderSearch, Play, ChevronDown, ChevronUp, Shield, BookOpen } from 'lucide-react';

// Import hooks and utilities
import { useFormData, useAI, useAutoSave } from '../hooks';
import { useAuth } from '../hooks/useAuth';
import { getProject } from '../services/projectService';
import { calculateContrast } from '../utils/colorUtils';
import { filesToBase64, isImage, formatFileSize, getFileIcon } from '../utils/fileUtils';
import { exportPRD, exportToPDF, exportToDOCX, downloadBlob } from '../utils/exportUtils';
import { sendPRDViaEmail, isValidEmail } from '../utils/emailUtils';
import * as XLSX from 'xlsx-js-style';
import { generateExcelTemplate, parseExcelToFormData } from '../utils/excelUtils';

// Import constants
import {
  STEPS,
  DEMOGRAPHY_OPTIONS,
  GEOGRAPHY_OPTIONS,
  FONT_OPTIONS,
  PLATFORM_OPTIONS,
  TECH_STACK_OPTIONS,
  APP_IDEA_TEMPLATE,
  PROPOSAL_TEMPLATES,
  PRD_REVIEW_CHECKLIST,
  EXTENDED_PRD_REVIEW_CHECKLIST,
  DOCUMENT_CHECKLIST,
  HELP_TEXTS,
  ISTVON_SECTIONS,
  PRD_PROMPT_TEMPLATE,
  DEFAULT_PRD_PROMPT
} from '../constants';

// Import new section components
import UserPersonasSection from './sections/UserPersonasSection';
import UserJourneySection from './sections/UserJourneySection';
import FeaturePrioritySection from './sections/FeaturePrioritySection';
import SuccessMetricsSection from './sections/SuccessMetricsSection';
import NavigationArchSection from './sections/NavigationArchSection';
import TechJustificationsSection from './sections/TechJustificationsSection';
import DatabaseArchSection from './sections/DatabaseArchSection';
import SecurityComplianceSection from './sections/SecurityComplianceSection';
import PerformanceSection from './sections/PerformanceSection';
import CompetitivePositionSection from './sections/CompetitivePositionSection';
import TypeScaleSection from './sections/TypeScaleSection';
import ComponentSpecsSection from './sections/ComponentSpecsSection';
import DashboardLayoutSection from './sections/DashboardLayoutSection';
import UXGuidelinesSection from './sections/UXGuidelinesSection';
import ResponsiveDesignSection from './sections/ResponsiveDesignSection';
import DevPhasesSection from './sections/DevPhasesSection';
import TestingStrategySection from './sections/TestingStrategySection';
import DeploymentSection from './sections/DeploymentSection';
import BudgetResourceSection from './sections/BudgetResourceSection';

// Multi-select dropdown for Technology Stack fields
function TechStackSelect({ label, selected, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const safeSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
  const filtered = (options || []).filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase()) && !safeSelected.includes(opt)
  );

  const addItem = (item) => {
    onChange([...safeSelected, item]);
    setSearch('');
  };
  const removeItem = (item) => onChange(safeSelected.filter(i => i !== item));
  const addCustom = () => {
    const val = search.trim();
    if (val && !safeSelected.includes(val)) {
      addItem(val);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-3" ref={ref}>
      <h4 className="font-bold text-gray-800 mb-2 text-xs">{label}</h4>
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
        {safeSelected.map(item => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {item}
            <button onClick={() => removeItem(item)} className="hover:text-blue-900 ml-0.5">&times;</button>
          </span>
        ))}
      </div>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:border-blue-400 outline-none"
          placeholder="Type to search or add..."
        />
        {/* Dropdown */}
        {open && (filtered.length > 0 || search.trim()) && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filtered.map(opt => (
              <button key={opt} onClick={() => addItem(opt)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors">
                {opt}
              </button>
            ))}
            {search.trim() && !options.includes(search.trim()) && !safeSelected.includes(search.trim()) && (
              <button onClick={addCustom} className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100">
                + Add "{search.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PRDGenerator() {
  // Form data hook
  const {
    formData,
    setFormData,
    handleInputChange,
    handleNestedChange,
    handleArrayItemUpdate,
    addToArray,
    removeFromArray,
    removeFromArrayByValue,
    loadPreviousTechStack
  } = useFormData();

  // Get project ID from URL (/app/project/:id)
  const { id: projectId } = useParams();
  const { user } = useAuth();

  // Auto-save to Supabase (5s debounce)
  const { autoSaveStatus, lastSaved } = useAutoSave(projectId, formData);

  // Loading state for initial project load
  const [projectLoading, setProjectLoading] = useState(true);

  // Load existing project data on mount
  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setProjectLoading(false);
        return;
      }
      try {
        const project = await getProject(projectId);
        if (project?.form_data) {
          setFormData(project.form_data);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setProjectLoading(false);
      }
    }
    loadProject();
  }, [projectId, setFormData]);

  // AI hook
  const {
    isProcessing: aiEnhancing,
    error: aiError,
    isConfigured: aiConfigured,
    provider,
    backendStatus,
    enhanceProblemStatement,
    enhanceGoal,
    suggestOutOfScope,
    recommendAPIs,
    discoverCompetitors,
    discoverCompetitorPainpoints,
    suggestChartGuidelines,
    suggestImageGuidelines,
    generatePRD: generatePRDFromAI,
    generateProposalCoverLetter,
    enhancePrdPrompt,
    analyzeUploadedFiles,
    analyzeDriveLink,
    coworkFetch,
    generateUITemplates,
    // Auto-population methods
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
    // Validation methods
    validateTechStack,
    validateTimeline,
    validateBudget,
    validateDependencies,
    clearError,
    refreshStatus
  } = useAI();

  // Step state synced with URL query param (?step=1..4)
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = Math.max(0, Math.min(3, parseInt(searchParams.get('step') || '1', 10) - 1));
  const setCurrentStep = useCallback((n) => {
    setSearchParams({ step: n + 1 }, { replace: true });
  }, [setSearchParams]);
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  const [showMappedChecklist, setShowMappedChecklist] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [demographySearch, setDemographySearch] = useState('');
  const [geographySearch, setGeographySearch] = useState('');
  const [showDemographyDropdown, setShowDemographyDropdown] = useState(false);
  const [showGeographyDropdown, setShowGeographyDropdown] = useState(false);
  const [prdReviewChecked, setPrdReviewChecked] = useState({});
  const [prdReviewComplete, setPrdReviewComplete] = useState(false);
  const [proposalGenerated, setProposalGenerated] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showIstvonTemplate, setShowIstvonTemplate] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [generatedProposalContent, setGeneratedProposalContent] = useState({ coverLetter: '', salesProposal: '' });
  const [activeProposalTab, setActiveProposalTab] = useState('coverLetter');
  const [pendingFileFields, setPendingFileFields] = useState(null);
  const [showFileAnalysisDialog, setShowFileAnalysisDialog] = useState(false);
  const [driveSynced, setDriveSynced] = useState({ google: false, onedrive: false });
  const [driveSyncing, setDriveSyncing] = useState({ google: false, onedrive: false });
  const [allowClaudeCowork, setAllowClaudeCowork] = useState(false);
  const [coworkFolderPath, setCoworkFolderPath] = useState('');
  const [coworkSources, setCoworkSources] = useState({ localFolder: true, uploadedFiles: true, googleDrive: true, oneDrive: true });
  const [coworkRunning, setCoworkRunning] = useState(false);
  const [coworkResult, setCoworkResult] = useState(null);
  const [discoveringPainpoints, setDiscoveringPainpoints] = useState({});
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [activeAiField, setActiveAiField] = useState(null);
  const [uiTemplates, setUiTemplates] = useState(null);
  const [generatingTemplates, setGeneratingTemplates] = useState(false);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(null);
  const [templatesMinimized, setTemplatesMinimized] = useState(false);

  // Validation state
  const [validationResults, setValidationResults] = useState({
    techStack: null, timeline: null, budget: null, dependencies: null
  });
  const [validating, setValidating] = useState(false);

  // Refs for click outside handling
  const demographyRef = useRef(null);
  const geographyRef = useRef(null);
  const competitorsAutoFilled = useRef(false);
  const prdContentRef = useRef(null);
  const pendingExcelData = useRef(null);

  // Icon mapping
  const iconComponents = { Sparkles, Rocket, Palette, FileText };

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (demographyRef.current && !demographyRef.current.contains(event.target)) {
        setShowDemographyDropdown(false);
      }
      if (geographyRef.current && !geographyRef.current.contains(event.target)) {
        setShowGeographyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check PRD review completion (including extended items)
  const allChecklistItems = [...PRD_REVIEW_CHECKLIST, ...EXTENDED_PRD_REVIEW_CHECKLIST];
  useEffect(() => {
    const allChecked = allChecklistItems.every(item => prdReviewChecked[item.id]);
    setPrdReviewComplete(allChecked);
  }, [prdReviewChecked]);

  // Auto-check PRD review items based on form data (including extended items)
  useEffect(() => {
    const autoChecked = {};
    allChecklistItems.forEach(item => {
      if (item.checkField) {
        const value = formData[item.checkField];
        if (Array.isArray(value)) {
          autoChecked[item.id] = value.length > 0;
        } else if (typeof value === 'object' && value !== null) {
          autoChecked[item.id] = Object.values(value).some(v => v && v !== '');
        } else {
          autoChecked[item.id] = !!value && value !== '';
        }
      }
    });
    setPrdReviewChecked(prev => ({ ...prev, ...autoChecked }));
  }, [formData]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle previous tech stack toggle
  useEffect(() => {
    if (formData.usePreviousTechStack) {
      const loaded = loadPreviousTechStack();
      if (!loaded) {
        showNotification('No previous tech stack found', 'error');
        handleInputChange('usePreviousTechStack', false);
      }
    }
  }, [formData.usePreviousTechStack]);

  // Auto-populate competitors when entering Step 1 with app name available
  useEffect(() => {
    if (
      currentStep === 1 &&
      !competitorsAutoFilled.current &&
      aiConfigured &&
      formData.appName &&
      formData.competitors.every(c => !c.name)
    ) {
      competitorsAutoFilled.current = true;
      showNotification('Discovering competitors for ' + formData.appName + '...', 'info');
      (async () => {
        const result = await discoverCompetitors(formData.appName, formData.appIdea || '', formData.targetAudienceDemography);
        if (result.success && result.data) {
          handleInputChange('competitors', result.data);
          showNotification('Competitors auto-discovered for ' + formData.appName);
        }
      })();
    }
  }, [currentStep, aiConfigured, formData.appName]);

  // Filter functions
  const filteredDemography = DEMOGRAPHY_OPTIONS.filter(opt =>
    opt.toLowerCase().includes(demographySearch.toLowerCase()) &&
    !formData.targetAudienceDemography.includes(opt)
  );

  const filteredGeography = GEOGRAPHY_OPTIONS.filter(opt =>
    opt.toLowerCase().includes(geographySearch.toLowerCase()) &&
    !formData.targetAudienceGeography.includes(opt)
  );

  // Demography handlers
  const addDemography = (option) => {
    if (formData.targetAudienceDemography.length < 3) {
      addToArray('targetAudienceDemography', option);
    }
    setDemographySearch('');
    setShowDemographyDropdown(false);
  };

  const removeDemography = (option) => {
    removeFromArrayByValue('targetAudienceDemography', option);
  };

  // Geography handlers
  const addGeography = (option) => {
    if (formData.targetAudienceGeography.length < 3) {
      addToArray('targetAudienceGeography', option);
    }
    setGeographySearch('');
    setShowGeographyDropdown(false);
  };

  const removeGeography = (option) => {
    removeFromArrayByValue('targetAudienceGeography', option);
  };

  // File upload handler with base64 conversion, executable blocking, and AI auto-fill
  const handleFileUpload = async (event, type = 'files') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Block executable files
    const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.scr'];
    const blockedFiles = Array.from(files).filter(f =>
      blockedExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (blockedFiles.length > 0) {
      showNotification(`Blocked: ${blockedFiles.map(f => f.name).join(', ')} — executable files are not allowed`, 'error');
      event.target.value = '';
      return;
    }

    // Intercept Excel uploads for template parsing
    const excelFile = Array.from(files).find(f =>
      f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls')
    );
    if (excelFile) {
      handleExcelUpload(excelFile);
      event.target.value = '';
      return;
    }

    try {
      const convertedFiles = await filesToBase64(files);
      const field = type === 'photos' ? 'uploadedPhotos' : 'uploadedFiles';

      if (type === 'photos') {
        const remaining = 4 - formData.uploadedPhotos.length;
        if (remaining <= 0) {
          showNotification('Maximum 4 photos allowed', 'error');
          event.target.value = '';
          return;
        }
        const limited = convertedFiles.slice(0, remaining);
        handleInputChange(field, [...formData[field], ...limited]);
        if (convertedFiles.length > remaining) {
          showNotification(`${limited.length} photo(s) uploaded (max 4 reached)`);
        } else {
          showNotification(`${limited.length} photo(s) uploaded successfully`);
        }
      } else {
        handleInputChange(field, [...formData[field], ...convertedFiles]);
        showNotification(`${convertedFiles.length} file(s) uploaded successfully`);
      }

      // AI auto-fill: analyze uploaded files for PRD-relevant content (only for document uploads)
      if (type === 'files' && aiConfigured) {
        try {
          const result = await analyzeUploadedFiles(convertedFiles, formData);
          if (result.success && result.data) {
            const { fields, relevantCount } = result.data;
            if (relevantCount > 0) {
              // Store extracted fields and show preview dialog — don't auto-apply
              setPendingFileFields(fields);
              setShowFileAnalysisDialog(true);
              showNotification(`AI found ${relevantCount} field${relevantCount > 1 ? 's' : ''} — review before applying`, 'info');
            } else {
              showNotification("Uploaded files don't contain info relevant to app fields", 'info');
            }
          }
        } catch {
          // AI analysis failed silently — files are still uploaded
        }
      }
    } catch (error) {
      showNotification('Error uploading files', 'error');
    }

    // Reset input
    event.target.value = '';
  };

  // Logo upload handler
  const handleLogoUpload = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const [convertedFile] = await filesToBase64([file]);
      handleInputChange(type === 'primary' ? 'primaryLogo' : 'secondaryLogo', convertedFile);
      showNotification('Logo uploaded successfully');
    } catch (error) {
      showNotification('Error uploading logo', 'error');
    }

    event.target.value = '';
  };

  // Generate UI preview templates
  const handleGenerateUITemplates = async () => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }
    if (!formData.appName && !formData.appIdea) {
      showNotification('Add an App Name or App Idea in Step 1 first', 'error');
      return;
    }
    setGeneratingTemplates(true);
    try {
      const result = await generateUITemplates(
        formData.appName, formData.appIdea, formData.platform,
        formData.targetAudienceDemography, formData.numberOfUsers,
        formData.appStructure, formData.selectedTechStack
      );
      if (result.success && result.data) {
        setUiTemplates(Array.isArray(result.data) ? result.data : result.data.templates || []);
        showNotification('UI templates generated — scroll down to preview');
      } else {
        showNotification(result.error || 'Failed to generate UI templates', 'error');
      }
    } catch {
      showNotification('Error generating UI templates', 'error');
    }
    setGeneratingTemplates(false);
  };

  // Download Excel template
  const handleDownloadExcelTemplate = () => {
    try {
      const wb = generateExcelTemplate();
      XLSX.writeFile(wb, 'PRD_Template.xlsx');
      showNotification('Excel template downloaded — fill it out and upload to auto-populate fields');
    } catch (error) {
      showNotification('Error generating Excel template', 'error');
    }
  };

  // Handle Excel file upload — parse and show preview
  const handleExcelUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const { parsedData, displayFields } = parseExcelToFormData(workbook);
      const fieldCount = Object.keys(displayFields).length;

      if (fieldCount === 0) {
        showNotification('No filled fields found in the Excel file — make sure you filled Column B', 'info');
        return;
      }

      pendingExcelData.current = parsedData;
      setPendingFileFields(displayFields);
      setShowFileAnalysisDialog(true);
      showNotification(`Excel processed — ${fieldCount} field${fieldCount > 1 ? 's' : ''} found — review before applying`, 'info');
    } catch (error) {
      showNotification('Error reading Excel file — make sure it\'s a valid .xlsx file', 'error');
    }
  };

  // Remove file handler
  const removeFile = (field, index) => {
    removeFromArray(field, index);
  };

  // Template apply handler
  const handleTemplateApply = () => {
    const filledTemplate = APP_IDEA_TEMPLATE
      .replace('[App Name]', formData.appName || 'Your App')
      .replace('[platform type]', (formData.platform || []).join(', ') || 'application')
      .replace('[target audience]', formData.targetAudienceDemography[0] || 'users')
      .replace('[primary function]', 'solve specific problems');

    handleInputChange('appIdea', filledTemplate.substring(0, 250));
    setShowTemplateDialog(false);
    showNotification('Template applied successfully');
  };

  // AI Enhancement handler
  const aiEnhanceField = async (field) => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }

    setActiveAiField(field);
    let result;
    switch (field) {
      case 'problemStatement':
        result = await enhanceProblemStatement(formData.problemStatement, formData.appName, formData.appIdea);
        break;
      case 'goal':
        result = await enhanceGoal(formData.goal, formData.appName, formData.problemStatement);
        break;
      case 'outOfScope':
        result = await suggestOutOfScope(formData.appName, formData.appIdea, (formData.platform || []).join(', '));
        break;
      case 'chartGuidelines':
        result = await suggestChartGuidelines(formData.primaryColor, formData.secondaryColor);
        break;
      case 'imageGuidelines':
        result = await suggestImageGuidelines(formData.imageBorderRadius, formData.imageAspectRatio);
        break;
      default:
        setActiveAiField(null);
        return;
    }
    setActiveAiField(null);

    if (result.success) {
      setPendingChanges({ field, originalValue: formData[field], newValue: result.data });
      setShowUndoDialog(true);
    } else {
      showNotification(result.error || 'AI enhancement failed', 'error');
    }
  };

  // AI Recommend full tech stack
  const aiRecommendAPIs = async () => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }
    setActiveAiField('techStack');
    const result = await recommendAPIs(formData.appName, formData.appIdea, (formData.platform || []).join(', '), formData.selectedTechStack);
    setActiveAiField(null);

    if (result.success && result.data) {
      const updated = { ...formData.selectedTechStack };
      const allFields = ['frontend', 'css', 'backend', 'llm', 'mcp', 'testing', 'deployment', 'reporting', 'apis', 'localLlm', 'evalTools', 'additional'];
      let filledCount = 0;
      allFields.forEach(field => {
        const rec = result.data[field];
        if (Array.isArray(rec) && rec.length > 0) {
          // Merge with existing selections (no duplicates)
          const existing = Array.isArray(updated[field]) ? updated[field] : [];
          const merged = [...new Set([...existing, ...rec])];
          updated[field] = merged;
          filledCount++;
        }
      });
      handleInputChange('selectedTechStack', updated);
      showNotification(`AI recommended technologies for ${filledCount} categories`);
    } else {
      showNotification(result.error || 'Failed to get recommendations', 'error');
    }
  };

  // AI Discover Competitors
  const aiDiscoverCompetitors = async () => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }
    setActiveAiField('competitors');
    const result = await discoverCompetitors(formData.appName, formData.appIdea, formData.targetAudienceDemography);
    setActiveAiField(null);

    if (result.success && result.data) {
      handleInputChange('competitors', result.data);
      showNotification('Competitors discovered');
    } else {
      showNotification(result.error || 'Failed to discover competitors', 'error');
    }
  };

  // Discover pain points for a single competitor from review sites
  const aiDiscoverPainpoints = async (index) => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }
    const comp = formData.competitors[index];
    if (!comp.name) {
      showNotification('Enter a competitor name first', 'error');
      return;
    }
    setDiscoveringPainpoints(prev => ({ ...prev, [index]: true }));
    const result = await discoverCompetitorPainpoints(comp.name, formData.appName, formData.appIdea);
    setDiscoveringPainpoints(prev => ({ ...prev, [index]: false }));
    if (result.success && result.data) {
      const updated = [...formData.competitors];
      updated[index] = {
        ...updated[index],
        url: result.data.url || updated[index].url,
        analysis: result.data.painPoints || ''
      };
      handleInputChange('competitors', updated);
      showNotification(`Pain points discovered for ${comp.name}`);
    } else {
      showNotification(result.error || 'Failed to discover pain points', 'error');
    }
  };

  // Accept AI changes
  const acceptAiChanges = () => {
    if (pendingChanges.field) {
      handleInputChange(pendingChanges.field, pendingChanges.newValue);
      showNotification('Changes applied');
    }
    setShowUndoDialog(false);
    setPendingChanges({});
  };

  // Accept file analysis fields
  const acceptFileAnalysis = () => {
    if (pendingExcelData.current) {
      // Deep merge for Excel upload
      const excelData = pendingExcelData.current;
      setFormData(prev => ({
        ...prev,
        ...excelData,
        istvonData: { ...prev.istvonData, ...(excelData.istvonData || {}) },
        appStructure: { ...prev.appStructure, ...(excelData.appStructure || {}) },
        selectedTechStack: { ...prev.selectedTechStack, ...(excelData.selectedTechStack || {}) },
      }));
      const count = Object.keys(pendingFileFields || {}).length;
      showNotification(`${count} field${count > 1 ? 's' : ''} auto-filled from Excel template`);
      pendingExcelData.current = null;
    } else if (pendingFileFields) {
      Object.entries(pendingFileFields).forEach(([key, value]) => {
        handleInputChange(key, value);
      });
      const count = Object.keys(pendingFileFields).length;
      showNotification(`${count} field${count > 1 ? 's' : ''} auto-filled from uploaded files`);
    }
    setShowFileAnalysisDialog(false);
    setPendingFileFields(null);
  };

  const dismissFileAnalysis = () => {
    setShowFileAnalysisDialog(false);
    setPendingFileFields(null);
    pendingExcelData.current = null;
    showNotification('File analysis dismissed — fields unchanged');
  };

  // Field label map for display
  const fieldLabels = {
    appName: 'App Name',
    appIdea: 'App Idea',
    problemStatement: 'Problem Statement',
    goal: 'Goal',
    outOfScope: 'Out of Scope',
    platform: 'Platform',
    prdPromptTemplate: 'PRD Prompt',
    projectType: 'Project Type',
    dueDate: 'Due Date',
    numberOfUsers: 'Number of Users',
    numberOfAdmins: 'Number of Admins',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    accentColor: 'Accent Color',
    primaryFont: 'Primary Font',
    headingsFont: 'Headings Font',
    h1Size: 'H1 Size',
    h2Size: 'H2 Size',
    h3Size: 'H3 Size',
    h4Size: 'H4 Size',
    h5Size: 'H5 Size',
    bodySize: 'Body Size',
    chartColor1: 'Chart Color 1',
    chartColor2: 'Chart Color 2',
    chartColor3: 'Chart Color 3',
    chartColor4: 'Chart Color 4',
    chartColor5: 'Chart Color 5',
    chartGuidelines: 'Chart Guidelines',
    imageGuidelines: 'Image Guidelines',
    imageBorderRadius: 'Image Border Radius',
    imageAspectRatio: 'Image Aspect Ratio',
    imageQuality: 'Image Quality',
    assignedTeam: 'Assigned Team',
    targetAudienceDemography: 'Target Audience - Demography',
    targetAudienceGeography: 'Target Audience - Geography',
  };

  // Update competitor — clear url/analysis when name is edited by user
  const updateCompetitor = (index, field, value) => {
    if (field === 'name') {
      const updated = [...formData.competitors];
      updated[index] = { ...updated[index], name: value, url: '', analysis: '' };
      handleInputChange('competitors', updated);
    } else {
      handleArrayItemUpdate('competitors', index, field, value);
    }
  };

  // Milestone handlers
  const addMilestone = () => {
    addToArray('milestones', { id: Date.now(), name: '', date: '', description: '' });
  };

  const updateMilestone = (id, field, value) => {
    const index = formData.milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      handleArrayItemUpdate('milestones', index, field, value);
    }
  };

  const removeMilestone = (id) => {
    const index = formData.milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      removeFromArray('milestones', index);
    }
  };

  // Generate PRD
  const generatePRD = async () => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }

    setActiveAiField('generatePRD');
    const result = await generatePRDFromAI(formData);
    setActiveAiField(null);

    if (result.success) {
      handleInputChange('generatedPRD', result.data);
      setPrdReviewChecked({});
      showNotification('PRD generated successfully');
    } else {
      showNotification(result.error || 'Failed to generate PRD', 'error');
    }
  };

  // Generate Proposal
  const generateProposal = async (template) => {
    setActiveAiField('proposal');
    const result = await generateProposalCoverLetter(formData, template);
    setActiveAiField(null);

    if (result.success) {
      setGeneratedProposalContent(prev => ({
        ...prev,
        [template]: result.data
      }));
      setActiveProposalTab(template);
      setProposalGenerated(true);
      showNotification(`${template === 'coverLetter' ? 'Cover Letter' : 'Sales Proposal'} generated`);
    } else {
      showNotification(result.error || 'Failed to generate proposal', 'error');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard!');
    } catch (err) {
      showNotification('Failed to copy', 'error');
    }
  };

  // Download proposal
  const downloadProposal = (content, type) => {
    const fullContent = `${content}\n\n---\nPowered by ISTVON PRD Prompt Framework`;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'coverLetter' ? 'CoverLetter' : 'SalesProposal'}-${formData.appName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Downloaded!');
  };

  // Export PRD with real formats
  const handleExportPRD = async (format) => {
    setIsExporting(true);
    const prdWithWatermark = formData.generatedPRD + '\n\n---\nPowered by ISTVON PRD Prompt Framework';

    const result = await exportPRD(format, prdWithWatermark, formData);

    if (result.success) {
      showNotification(`PRD exported as ${format.toUpperCase()}`);
    } else {
      showNotification(result.error || 'Export failed', 'error');
    }
    setIsExporting(false);
  };

  // Highlight PRD section when checklist item is clicked
  const highlightPrdSection = (searchTerm) => {
    if (!formData.generatedPRD || !prdContentRef.current) return;
    const text = formData.generatedPRD.toLowerCase();
    if (!text.includes(searchTerm.toLowerCase())) {
      showNotification(`"${searchTerm}" not found in PRD`, 'error');
      return;
    }
    setHighlightedSection(searchTerm);
    // Wait for re-render so the highlighted span with data-highlight exists, then scroll to it
    setTimeout(() => {
      const el = prdContentRef.current?.querySelector('[data-highlight="true"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    // Clear highlight after 10 seconds
    setTimeout(() => setHighlightedSection(null), 10000);
  };

  // Send to team via email
  const handleSendToTeam = () => {
    if (formData.assignedTeam.length === 0) {
      showNotification('Please add team members first', 'error');
      return;
    }

    try {
      const result = sendPRDViaEmail(formData.assignedTeam, formData.generatedPRD, formData);
      if (result.truncated) {
        showNotification(result.message, 'info');
      } else {
        showNotification('Email client opened');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // Add team member
  const handleAddTeamMember = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const email = e.target.value.trim();
      if (isValidEmail(email)) {
        if (!formData.assignedTeam.includes(email)) {
          addToArray('assignedTeam', email);
        }
        e.target.value = '';
      } else {
        showNotification('Please enter a valid email', 'error');
      }
    }
  };

  // Run all validators
  const runValidation = async () => {
    setValidating(true);
    const results = { techStack: null, timeline: null, budget: null, dependencies: null };
    try {
      const [techRes, timeRes, budgetRes, depsRes] = await Promise.allSettled([
        validateTechStack(formData.selectedTechStack),
        validateTimeline(formData.milestones, formData.featurePriority, formData.budgetPlanning?.team?.requiredRoles?.length || 1),
        validateBudget(formData.budgetPlanning?.costs, formData.featurePriority, formData.milestones),
        validateDependencies(formData)
      ]);
      if (techRes.status === 'fulfilled' && techRes.value) results.techStack = techRes.value;
      if (timeRes.status === 'fulfilled' && timeRes.value) results.timeline = timeRes.value;
      if (budgetRes.status === 'fulfilled' && budgetRes.value) results.budget = budgetRes.value;
      if (depsRes.status === 'fulfilled' && depsRes.value) results.dependencies = depsRes.value;
      setValidationResults(results);
      const warnings = [
        ...(results.techStack?.warnings || []),
        ...(results.timeline?.warnings || []),
        ...(results.budget?.warnings || []),
        ...(results.dependencies?.missingDependencies || [])
      ];
      if (warnings.length === 0) {
        showNotification('All validations passed!', 'success');
      } else {
        showNotification(`${warnings.length} warning(s) found — review below`, 'info');
      }
    } catch (err) {
      showNotification('Validation failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setValidating(false);
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep === 0 && !formData.appIdea.trim()) {
      showNotification('App Idea is required before proceeding', 'error');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Generate Scope of Work markdown content
  const generateScopeOfWorkContent = () => {
    const lines = [];
    lines.push('# Scope of Work');
    lines.push(`**${formData.appName || 'Untitled App'}** | Generated ${new Date().toLocaleDateString()}`);
    lines.push('---\n');

    lines.push('## 1. App Concept');
    if (formData.appName) lines.push(`**App Name:** ${formData.appName}`);
    if (formData.appIdea) lines.push(`**App Idea:** ${formData.appIdea}`);
    if (formData.problemStatement) lines.push(`**Problem Statement:** ${formData.problemStatement}`);
    if (formData.mainGoal) lines.push(`**Main Goal:** ${formData.mainGoal}`);
    lines.push('');

    lines.push('## 2. App Description');
    if (formData.appDescription) lines.push(formData.appDescription);
    lines.push('');

    lines.push('## 3. Scope');
    if (formData.inScope) lines.push(`**In Scope:**\n${formData.inScope}`);
    if (formData.outOfScope) lines.push(`**Out of Scope:**\n${formData.outOfScope}`);
    lines.push('');

    if (formData.uploadedFiles.length > 0) {
      lines.push('## 4. Uploaded Documents');
      formData.uploadedFiles.forEach(f => lines.push(`- ${f.name} (${(f.size / 1024).toFixed(1)} KB)`));
      lines.push('');
    }

    if (formData.googleDriveLink || formData.oneDriveLink) {
      lines.push('## External Links');
      if (formData.googleDriveLink) lines.push(`- **Google Drive:** ${formData.googleDriveLink}`);
      if (formData.oneDriveLink) lines.push(`- **OneDrive:** ${formData.oneDriveLink}`);
      lines.push('');
    }

    if (formData.projectType || formData.dueDate || formData.milestones?.length > 0) {
      lines.push('## Timeline & Project Details');
      if (formData.projectType) lines.push(`**Project Type:** ${formData.projectType}`);
      if (formData.dueDate) lines.push(`**Due Date:** ${formData.dueDate}`);
      if (formData.milestones?.length > 0) {
        lines.push('**Milestones:**');
        formData.milestones.forEach(m => lines.push(`- ${m.name}${m.date ? ` (${m.date})` : ''}${m.description ? ` — ${m.description}` : ''}`));
      }
      lines.push('');
    }

    if (formData.prdPromptTemplate) {
      lines.push('## BuLLMake PRD Prompt');
      lines.push(formData.prdPromptTemplate);
      lines.push('');
    }

    if (formData.istvonData && Object.values(formData.istvonData).some(v => v)) {
      lines.push('## ISTVON Framework');
      ISTVON_SECTIONS.forEach(section => {
        const filled = section.fields.filter(f => formData.istvonData[f.key]);
        if (filled.length > 0) {
          lines.push(`### ${section.letter} - ${section.title}`);
          filled.forEach(f => lines.push(`- **${f.label}:** ${formData.istvonData[f.key]}`));
          lines.push('');
        }
      });
    }

    if (formData.targetAudienceDemography?.length > 0) {
      lines.push('## Target Demography');
      lines.push(formData.targetAudienceDemography.join(', '));
      lines.push('');
    }
    if (formData.targetAudienceGeography?.length > 0) {
      lines.push('## Target Geography');
      lines.push(formData.targetAudienceGeography.join(', '));
      lines.push('');
    }

    // User Personas
    if (formData.primaryUserPersonas?.length > 0) {
      lines.push('## User Personas');
      formData.primaryUserPersonas.forEach(p => {
        lines.push(`### ${p.demographic || 'User'} — ${p.role || 'Role'}`);
        if (p.painPoints?.length > 0) lines.push(`**Pain Points:** ${p.painPoints.join(', ')}`);
        if (p.goals?.length > 0) lines.push(`**Goals:** ${p.goals.join(', ')}`);
        if (p.successMetrics?.length > 0) lines.push(`**Success Metrics:** ${p.successMetrics.join(', ')}`);
        lines.push('');
      });
    }

    // User Stories
    if (formData.userStories?.length > 0) {
      lines.push('## User Stories');
      formData.userStories.forEach(s => {
        lines.push(`- As a ${s.asA || '...'}, I want to ${s.iWantTo || '...'}, so that ${s.soThat || '...'}`);
      });
      lines.push('');
    }

    // Feature Priority
    const fp = formData.featurePriority;
    if (fp && (fp.mustHave?.length || fp.shouldHave?.length || fp.couldHave?.length || fp.wontHave?.length)) {
      lines.push('## Feature Priority (MoSCoW)');
      if (fp.mustHave?.length) { lines.push('**Must Have:**'); fp.mustHave.forEach(f => lines.push(`- ${f}`)); }
      if (fp.shouldHave?.length) { lines.push('**Should Have:**'); fp.shouldHave.forEach(f => lines.push(`- ${f}`)); }
      if (fp.couldHave?.length) { lines.push('**Could Have:**'); fp.couldHave.forEach(f => lines.push(`- ${f}`)); }
      if (fp.wontHave?.length) { lines.push("**Won't Have:**"); fp.wontHave.forEach(f => lines.push(`- ${f}`)); }
      lines.push('');
    }

    // Success Metrics
    const sm = formData.successMetrics;
    if (sm && (sm.activationMetrics?.length || sm.engagementMetrics?.length || sm.businessMetrics?.length)) {
      lines.push('## Success Metrics');
      if (sm.activationMetrics?.length) lines.push(`**Activation:** ${sm.activationMetrics.join(', ')}`);
      if (sm.engagementMetrics?.length) lines.push(`**Engagement:** ${sm.engagementMetrics.join(', ')}`);
      if (sm.businessMetrics?.length) lines.push(`**Business:** ${sm.businessMetrics.join(', ')}`);
      lines.push('');
    }

    // Technology Stack
    const ts = formData.selectedTechStack;
    if (ts && Object.values(ts).some(v => Array.isArray(v) ? v.length > 0 : !!v)) {
      lines.push('## Technology Stack');
      Object.entries(ts).filter(([, v]) => Array.isArray(v) ? v.length > 0 : !!v).forEach(([k, v]) => {
        lines.push(`- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`);
      });
      lines.push('');
    }

    // Security & Compliance
    const sec = formData.security;
    if (sec && Object.values(sec).some(v => v?.length > 0)) {
      lines.push('## Security & Compliance');
      if (sec.dataEncryption?.length) lines.push(`**Encryption:** ${sec.dataEncryption.join(', ')}`);
      if (sec.authMethods?.length) lines.push(`**Auth Methods:** ${sec.authMethods.join(', ')}`);
      if (sec.accessControl?.length) lines.push(`**Access Control:** ${sec.accessControl.join(', ')}`);
      const comp = formData.compliance;
      if (comp) {
        const flags = [comp.gdpr ? 'GDPR' : '', comp.soc2 ? 'SOC2' : '', comp.hipaa ? 'HIPAA' : ''].filter(Boolean);
        if (flags.length) lines.push(`**Compliance:** ${flags.join(', ')}`);
      }
      lines.push('');
    }

    // Development Phases
    if (formData.developmentPhases?.length > 0) {
      lines.push('## Development Phases');
      formData.developmentPhases.forEach((p, i) => {
        lines.push(`### Phase ${i + 1}: ${p.phaseName || 'Unnamed'}`);
        if (p.deliverables?.length) lines.push(`Deliverables: ${p.deliverables.join(', ')}`);
        if (p.dependencies?.length) lines.push(`Dependencies: ${p.dependencies.join(', ')}`);
      });
      lines.push('');
    }

    // Budget
    if (formData.budgetPlanning?.costs?.developmentCosts) {
      lines.push('## Budget & Resources');
      lines.push(`**Development Costs:** ${formData.budgetPlanning.costs.developmentCosts}`);
      if (formData.budgetPlanning.costs.operationalCosts) lines.push(`**Operational Costs:** ${formData.budgetPlanning.costs.operationalCosts}`);
      if (formData.budgetPlanning.costs.marketingCosts) lines.push(`**Marketing Costs:** ${formData.budgetPlanning.costs.marketingCosts}`);
      lines.push('');
    }

    return lines.join('\n');
  };

  // Download Scope of Work as PDF or DOC
  const downloadScopeOfWork = async (format = 'pdf') => {
    try {
      const content = generateScopeOfWorkContent();
      const appName = (formData.appName || 'scope-of-work').replace(/\s+/g, '-').toLowerCase();
      const sowFormData = { ...formData, appName: formData.appName || 'Scope of Work', prdVersion: '1.0' };
      let blob;
      let filename;
      if (format === 'docx') {
        blob = await exportToDOCX(content, sowFormData);
        filename = `${appName}-scope-of-work.docx`;
      } else {
        blob = await exportToPDF(content, sowFormData);
        filename = `${appName}-scope-of-work.pdf`;
      }
      downloadBlob(blob, filename);
      showNotification(`Scope of Work downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Scope of Work export error:', error);
      showNotification('Failed to export Scope of Work', 'error');
    }
  };

  // Help Tooltip Component
  const HelpTooltip = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <Info size={16} className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
      <div className="invisible group-hover:visible absolute z-50 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-2xl bottom-full mb-2 right-1/2 translate-x-1/2 leading-relaxed">
        {text}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 transform rotate-45"></div>
      </div>
    </div>
  );

  // Get step data with actual icon component
  const getStepData = (step) => {
    const IconComponent = iconComponents[step.icon] || Sparkles;
    return { ...step, IconComponent };
  };

  const currentStepData = getStepData(STEPS[currentStep]);
  const StepIcon = currentStepData.IconComponent;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  // Step 0: App Concept & Scope
  const renderStep0 = () => (
    <div className="space-y-8 bg-blue-50 p-6 rounded-2xl">
      {/* Section 1: App Concept */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
          App Concept
        </label>
        <div className="space-y-6">
          {/* App Name + App Idea */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                App Name
                <HelpTooltip text={HELP_TEXTS.appName} />
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => handleInputChange('appName', e.target.value)}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all ${formData.appName.length > 50 ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
                placeholder="App name..."
              />
              <div className="flex justify-end mt-1">
                <span className={`text-sm font-medium ${formData.appName.length > 50 ? 'text-red-500' : 'text-gray-500'}`}>{formData.appName.length}/50</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                App Idea <span className="text-red-500 ml-1">*</span>
                <HelpTooltip text={HELP_TEXTS.appIdea} />
              </label>
              <input
                type="text"
                value={formData.appIdea}
                onChange={(e) => handleInputChange('appIdea', e.target.value.slice(0, 250))}
                maxLength={250}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all ${formData.appIdea.length > 250 ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
                placeholder="Brief description..."
              />
              <div className="flex justify-end mt-1">
                <span className={`text-sm font-medium ${formData.appIdea.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>{formData.appIdea.length}/250</span>
              </div>
            </div>
          </div>

          {/* Problem Statement + Main Goal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  Problem Statement
                  <HelpTooltip text={HELP_TEXTS.problemStatement} />
                </label>
                <button
                  onClick={() => aiEnhanceField('problemStatement')}
                  disabled={activeAiField === 'problemStatement'}
                  className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {activeAiField === 'problemStatement' ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
                  AI Enhance
                </button>
              </div>
              <textarea
                value={formData.problemStatement}
                onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                rows="3"
                placeholder="Describe the problems your app will solve..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  Main Goal
                  <HelpTooltip text={HELP_TEXTS.goal} />
                </label>
                <button
                  onClick={() => aiEnhanceField('goal')}
                  disabled={activeAiField === 'goal'}
                  className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {activeAiField === 'goal' ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Wand2 size={16} className="mr-1.5" />}
                  AI Enhance
                </button>
              </div>
              <textarea
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                rows="3"
                placeholder="Define the primary objective..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Target Audience */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
          Target Audience
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div ref={demographyRef}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            Target Demography (Max 3)
            <HelpTooltip text={HELP_TEXTS.demography} />
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.targetAudienceDemography.map(demo => (
              <span key={demo} className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                {demo}
                <button onClick={() => removeDemography(demo)} className="ml-2 hover:text-blue-200">
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                placeholder="Search..."
              />
              {showDemographyDropdown && filteredDemography.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredDemography.map(opt => (
                    <button
                      key={opt}
                      onClick={() => addDemography(opt)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={geographyRef}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            Target Geography (Max 3)
            <HelpTooltip text={HELP_TEXTS.geography} />
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.targetAudienceGeography.map(geo => (
              <span key={geo} className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                {geo}
                <button onClick={() => removeGeography(geo)} className="ml-2 hover:text-blue-200">
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                placeholder="Search..."
              />
              {showGeographyDropdown && filteredGeography.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredGeography.map(opt => (
                    <button
                      key={opt}
                      onClick={() => addGeography(opt)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm"
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
      </div>

      {/* User Personas (Section 1.3) */}
      <UserPersonasSection
        formData={formData}
        handleInputChange={handleInputChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        handleArrayItemUpdate={handleArrayItemUpdate}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateUserPersonas={generateUserPersonas}
      />

      {/* User Journey & Stories (Section 1.4) */}
      <UserJourneySection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        handleArrayItemUpdate={handleArrayItemUpdate}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateUserJourney={generateUserJourney}
        generateUserStories={generateUserStories}
      />

      {/* Out of Scope */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-gray-800">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
            Out of Scope
            <HelpTooltip text={HELP_TEXTS.outOfScope} />
          </label>
          <button
            onClick={() => aiEnhanceField('outOfScope')}
            disabled={activeAiField === 'outOfScope'}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {activeAiField === 'outOfScope' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
            AI Enhance
          </button>
        </div>
        <textarea
          value={formData.outOfScope}
          onChange={(e) => handleInputChange('outOfScope', e.target.value)}
          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
          rows="4"
          placeholder="Features excluded from v1.0..."
        />
      </div>

      {/* Feature Priority - MoSCoW (Section 1.5) */}
      <FeaturePrioritySection
        formData={formData}
        handleInputChange={handleInputChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateMVPFeatures={generateMVPFeatures}
      />

      {/* Success Metrics (Section 1.6) */}
      <SuccessMetricsSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateSuccessMetrics={generateSuccessMetrics}
      />

      {/* Document Upload */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
          Upload Documents
          <HelpTooltip text={HELP_TEXTS.documents} />
        </label>

        {/* Two-column layout: Drop files + BuLLMake Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left column: Drop files + Drive links */}
          <div className="space-y-4">
            <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
              <FolderArchive size={32} className="text-gray-400 mb-2" />
              <span className="font-medium text-gray-700 text-sm">Drop files/ZIP or click to browse local folder</span>
              <span className="text-cyan-600 text-xs font-semibold mt-1 flex items-center gap-1"><Sparkles size={10} /> Or let AI auto-fetch documents</span>
              <small className="text-gray-400 text-xs mt-1 text-center">Files are validated internally. ZIP archives are extracted securely. Executable files are blocked.</small>
              <input type="file" onChange={(e) => handleFileUpload(e)} className="hidden" multiple />
            </label>

            {/* Drive links - stacked vertically */}
            <div className="space-y-3">
              {/* Google Drive - full width */}
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.googleDriveLink}
                    onChange={(e) => {
                      handleInputChange('googleDriveLink', e.target.value);
                      if (driveSynced.google) setDriveSynced(prev => ({ ...prev, google: false }));
                    }}
                    className={`w-full h-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm ${driveSynced.google ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
                    placeholder="Google Drive link"
                  />
                </div>
                <button
                  disabled={driveSyncing.google}
                  onClick={async () => {
                    if (!formData.googleDriveLink.trim()) {
                      showNotification('Enter a Google Drive link first', 'error');
                      return;
                    }
                    setDriveSyncing(prev => ({ ...prev, google: true }));
                    try {
                      const result = await analyzeDriveLink(formData.googleDriveLink, 'Google Drive', formData);
                      if (result.success && result.data) {
                        if (result.data.warning) {
                          showNotification(result.data.warning, 'error');
                        } else if (result.data.relevantCount > 0) {
                          setDriveSynced(prev => ({ ...prev, google: true }));
                          setPendingFileFields(result.data.fields);
                          setShowFileAnalysisDialog(true);
                          showNotification(`Google Drive synced — ${result.data.relevantCount} field${result.data.relevantCount > 1 ? 's' : ''} found`, 'info');
                        } else {
                          setDriveSynced(prev => ({ ...prev, google: true }));
                          showNotification('Google Drive synced — no relevant PRD info found in document', 'info');
                        }
                      } else {
                        showNotification(result.error || 'Failed to analyze Google Drive link', 'error');
                      }
                    } catch {
                      showNotification('Failed to sync Google Drive link', 'error');
                    }
                    setDriveSyncing(prev => ({ ...prev, google: false }));
                  }}
                  className={`px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    driveSyncing.google
                      ? 'bg-blue-100 text-blue-500 border-2 border-blue-200 cursor-wait'
                      : driveSynced.google
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border-2 border-gray-200'
                  }`}
                >
                  {driveSyncing.google ? <Loader2 size={16} className="animate-spin" /> : driveSynced.google ? <Check size={16} /> : <RefreshCw size={16} />}
                  {driveSyncing.google ? 'Syncing' : driveSynced.google ? 'Synced' : 'Sync'}
                </button>
              </div>
              {/* OneDrive - full width below */}
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.oneDriveLink}
                    onChange={(e) => {
                      handleInputChange('oneDriveLink', e.target.value);
                      if (driveSynced.onedrive) setDriveSynced(prev => ({ ...prev, onedrive: false }));
                    }}
                    className={`w-full h-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm ${driveSynced.onedrive ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
                    placeholder="OneDrive link"
                  />
                </div>
                <button
                  disabled={driveSyncing.onedrive}
                  onClick={async () => {
                    if (!formData.oneDriveLink.trim()) {
                      showNotification('Enter a OneDrive link first', 'error');
                      return;
                    }
                    setDriveSyncing(prev => ({ ...prev, onedrive: true }));
                    try {
                      const result = await analyzeDriveLink(formData.oneDriveLink, 'OneDrive', formData);
                      if (result.success && result.data) {
                        if (result.data.warning) {
                          showNotification(result.data.warning, 'error');
                        } else if (result.data.relevantCount > 0) {
                          setDriveSynced(prev => ({ ...prev, onedrive: true }));
                          setPendingFileFields(result.data.fields);
                          setShowFileAnalysisDialog(true);
                          showNotification(`OneDrive synced — ${result.data.relevantCount} field${result.data.relevantCount > 1 ? 's' : ''} found`, 'info');
                        } else {
                          setDriveSynced(prev => ({ ...prev, onedrive: true }));
                          showNotification('OneDrive synced — no relevant PRD info found in document', 'info');
                        }
                      } else {
                        showNotification(result.error || 'Failed to analyze OneDrive link', 'error');
                      }
                    } catch {
                      showNotification('Failed to sync OneDrive link', 'error');
                    }
                    setDriveSyncing(prev => ({ ...prev, onedrive: false }));
                  }}
                  className={`px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    driveSyncing.onedrive
                      ? 'bg-blue-100 text-blue-500 border-2 border-blue-200 cursor-wait'
                      : driveSynced.onedrive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border-2 border-gray-200'
                  }`}
                >
                  {driveSyncing.onedrive ? <Loader2 size={16} className="animate-spin" /> : driveSynced.onedrive ? <Check size={16} /> : <RefreshCw size={16} />}
                  {driveSyncing.onedrive ? 'Syncing' : driveSynced.onedrive ? 'Synced' : 'Sync'}
                </button>
              </div>
            </div>
          </div>

          {/* Right column: Claude Cowork + BuLLMake Checklist */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            {/* Claude Cowork - alternative to manual upload */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-3 mb-3 border border-cyan-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setAllowClaudeCowork(!allowClaudeCowork)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${allowClaudeCowork ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowClaudeCowork ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs font-medium text-blue-900">Allow Claude Cowork to fetch these documents</span>
              </label>

              {allowClaudeCowork && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-stretch gap-2">
                    <div className="relative flex-1">
                      <FolderSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                      <input
                        type="text"
                        value={coworkFolderPath}
                        onChange={(e) => setCoworkFolderPath(e.target.value)}
                        className="w-full h-full pl-9 pr-3 py-2 border-2 border-blue-200 rounded-lg text-xs bg-white focus:border-blue-400 outline-none"
                        placeholder="Local folder path (e.g., D:/Projects/MyApp)"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    {[
                      { key: 'localFolder', label: 'Local folder' },
                      { key: 'uploadedFiles', label: 'Uploaded files' },
                      { key: 'googleDrive', label: 'Google Drive' },
                      { key: 'oneDrive', label: 'OneDrive' }
                    ].map(src => (
                      <label key={src.key} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coworkSources[src.key]}
                          onChange={(e) => setCoworkSources(prev => ({ ...prev, [src.key]: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded border-blue-300 text-blue-600 focus:ring-blue-400"
                        />
                        <span className="text-blue-800">{src.label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    disabled={coworkRunning || !aiConfigured}
                    onClick={async () => {
                      const hasAnySource = (coworkSources.localFolder && coworkFolderPath.trim()) ||
                        (coworkSources.uploadedFiles && formData.uploadedFiles.length > 0) ||
                        (coworkSources.googleDrive && formData.googleDriveLink.trim()) ||
                        (coworkSources.oneDrive && formData.oneDriveLink.trim());

                      if (!hasAnySource) {
                        showNotification('Add at least one source — folder path, uploaded files, or a drive link', 'error');
                        return;
                      }

                      setCoworkRunning(true);
                      setCoworkResult(null);
                      try {
                        const result = await coworkFetch({
                          folderPath: coworkSources.localFolder ? coworkFolderPath : '',
                          uploadedFiles: coworkSources.uploadedFiles ? formData.uploadedFiles : [],
                          googleDriveLink: coworkSources.googleDrive ? formData.googleDriveLink : '',
                          oneDriveLink: coworkSources.oneDrive ? formData.oneDriveLink : '',
                          currentFormData: formData,
                          sources: coworkSources
                        });

                        if (result.success && result.data) {
                          setCoworkResult(result.data);
                          if (result.data.warning) {
                            showNotification(result.data.warning, 'error');
                          } else if (result.data.relevantCount > 0) {
                            setPendingFileFields(result.data.fields);
                            setShowFileAnalysisDialog(true);
                            const fileNames = (result.data.scannedFiles || []).map(f => f.name).join(', ');
                            showNotification(`Cowork scanned ${result.data.scannedCount} files (${fileNames}) — ${result.data.relevantCount} field${result.data.relevantCount > 1 ? 's' : ''} found`, 'info');
                          } else {
                            showNotification(`Scanned ${result.data.scannedCount} files — no relevant PRD info found`, 'info');
                          }
                        } else {
                          showNotification(result.error || 'Cowork analysis failed', 'error');
                        }
                      } catch {
                        showNotification('Cowork analysis failed', 'error');
                      }
                      setCoworkRunning(false);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      coworkRunning
                        ? 'bg-blue-100 text-blue-500 cursor-wait'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {coworkRunning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Claude is analyzing documents...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Start Cowork
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-blue-500 leading-tight">
                    Scans .txt .md .csv .json .pdf .docx files up to 3 folder levels deep. Max 2MB per file. Sensitive files skipped.
                  </p>
                </div>
              )}
            </div>

            <h4 className="font-semibold text-blue-800 mb-3 text-sm">📋 BuLLMake Document Checklist</h4>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-blue-800">
              {DOCUMENT_CHECKLIST.map(item => {
                const hasMatch = formData.uploadedFiles.some(f => {
                  const name = f.name.toLowerCase().replace(/[_\-./\\]/g, ' ');
                  return item.keywords.some(kw => name.includes(kw));
                });
                return (
                  <label key={item.id} className="flex items-center">
                    <input type="checkbox" checked={hasMatch} readOnly className="w-3 h-3 mr-1.5 rounded border-blue-300 text-blue-600 flex-shrink-0" />
                    <span className={hasMatch ? 'text-green-700 font-medium' : ''}>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {formData.uploadedFiles.length > 0 && (
          <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
            <h4 className="font-semibold text-blue-900 mb-3">
              Uploaded: {formData.uploadedFiles.length} files
            </h4>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {formData.uploadedFiles.map((file, idx) => (
                <div key={file.id} className="relative group text-xs bg-white p-2 rounded flex items-center">
                  {isImage(file.type) && file.base64 ? (
                    <img src={file.base64} alt={file.name} className="w-8 h-8 object-cover rounded mr-2" />
                  ) : (
                    <span className="mr-2">{getFileIcon(file.type)}</span>
                  )}
                  <div className="truncate flex-1">
                    <div className="truncate">{file.name}</div>
                    <div className="text-gray-400">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    onClick={() => removeFile('uploadedFiles', idx)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BuLLMake PRD Prompt Section */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-blue-900">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5</span>
            BuLLMake PRD Prompt
            <HelpTooltip text="We use this Prompt to generate your PRD!" />
          </label>
          <button
            onClick={async () => {
              if (!formData.appName && !formData.appIdea) {
                showNotification('Please enter App Name or App Idea first', 'error');
                return;
              }
              setActiveAiField('prdPrompt');
              const basePrompt = formData.prdPromptTemplate || DEFAULT_PRD_PROMPT;
              const result = await enhancePrdPrompt(basePrompt, formData.appName, formData.appIdea);
              setActiveAiField(null);
              if (result.success && result.data) {
                handleInputChange('prdPromptTemplate', result.data.substring(0, 1150));
                showNotification('PRD prompt enhanced with AI');
              } else {
                showNotification(result.error || 'Failed to enhance prompt', 'error');
              }
            }}
            disabled={activeAiField === 'prdPrompt'}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {activeAiField === 'prdPrompt' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
            AI Enhance
          </button>
        </div>
        <textarea
          value={formData.prdPromptTemplate || ''}
          onChange={(e) => handleInputChange('prdPromptTemplate', e.target.value)}
          className={`w-full px-5 py-4 bg-white border-2 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none ${(formData.prdPromptTemplate || '').length > 1150 ? 'border-red-300 text-red-600' : 'border-blue-200'}`}
          rows="5"
          placeholder="We use this Prompt to generate your PRD!"
        />
        <div className="flex justify-end items-center mt-4">
          <span className={`text-sm font-medium ${(formData.prdPromptTemplate || '').length > 1150 ? 'text-red-500' : 'text-blue-700'}`}>{(formData.prdPromptTemplate || '').length}/1150</span>
        </div>
      </div>

      {/* ISTVON Template Sections */}
      {showIstvonTemplate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-800">ISTVON Framework Sections</h4>
            <button
              onClick={() => {
                const sections = ISTVON_SECTIONS.map(section => {
                  const sectionData = section.fields
                    .map(field => `${field.label}: ${formData.istvonData[field.key] || '[Not specified]'}`)
                    .join(', ');
                  return `${section.letter} - ${section.title}: ${sectionData}`;
                }).join('\n');
                const fullPrompt = `Build the ${formData.appName || '[App Name]'} app using the DigiBull AI Coding System.\n\n${sections}\n\nPowered by ISTVON PRD Prompt Framework`;
                handleInputChange('prdPromptTemplate', fullPrompt.substring(0, 1150));
                showNotification('ISTVON template applied');
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Apply to Template
            </button>
          </div>
          {ISTVON_SECTIONS.map((section) => (
            <div key={section.id} className={`bg-white rounded-xl border-2 ${section.borderClass} p-4`}>
              <h5 className={`font-bold ${section.headerClass} mb-3 flex items-center`}>
                <span className={`w-8 h-8 ${section.bgClass} ${section.textClass} rounded-lg flex items-center justify-center text-sm font-bold mr-3`}>
                  {section.letter}
                </span>
                {section.title}
              </h5>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={formData.istvonData[field.key] || ''}
                      onChange={(e) => handleNestedChange('istvonData', field.key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );

  // Step 1: Platform & Tech Stack
  const renderStep1 = () => (
    <div className="space-y-8 bg-blue-50 p-6 rounded-2xl">
      {/* Platform Type - 2x4 Grid */}
      <div>
        <label className="flex items-center text-lg font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
          Select Platform Type
          <HelpTooltip text={HELP_TEXTS.platform} />
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORM_OPTIONS.map((option) => (
            <button
              key={option.name}
              onClick={() => {
                const current = formData.platform || [];
                const updated = current.includes(option.name)
                  ? current.filter(p => p !== option.name)
                  : [...current, option.name];
                handleInputChange('platform', updated);
              }}
              className={`px-3 py-2 rounded-lg border-2 font-bold text-xs transition-all ${(formData.platform || []).includes(option.name)
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
            >
              <div className="text-lg leading-none mb-0.5">{option.emoji}</div>
              <div className={`leading-tight ${(formData.platform || []).includes(option.name) ? 'text-blue-700' : 'text-gray-700'}`}>
                {option.name}
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">{option.sub}</div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Number of Users</label>
            <input
              type="number"
              min="0"
              value={formData.numberOfUsers}
              onChange={(e) => handleInputChange('numberOfUsers', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm"
              placeholder="e.g., 500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Number of Admins</label>
            <input
              type="number"
              min="0"
              value={formData.numberOfAdmins}
              onChange={(e) => handleInputChange('numberOfAdmins', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm"
              placeholder="e.g., 5"
            />
          </div>
        </div>
      </div>

      {/* App Structure */}
      <div>
        <label className="flex items-center text-lg font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
          App Structure
          <HelpTooltip text={HELP_TEXTS.appStructure} />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏠 Default Screen</label>
            <input
              type="text"
              value={formData.appStructure.defaultScreen}
              onChange={(e) => handleNestedChange('appStructure', 'defaultScreen', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
              placeholder="Home/Dashboard"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Main Workspace</label>
            <input
              type="text"
              value={formData.appStructure.workingScreen}
              onChange={(e) => handleNestedChange('appStructure', 'workingScreen', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
              placeholder="Primary work area"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Other Screens</label>
            <input
              type="text"
              value={formData.appStructure.otherScreens}
              onChange={(e) => handleNestedChange('appStructure', 'otherScreens', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 outline-none"
              placeholder="Settings, Profile..."
            />
          </div>
        </div>
      </div>

      {/* Navigation Architecture (Section 2.2) */}
      <NavigationArchSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateNavArchitecture={generateNavArchitecture}
      />

      {/* Technology Stack */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-lg font-bold text-gray-800">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
            Technology Stack
            <HelpTooltip text={HELP_TEXTS.techStack} />
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
              disabled={activeAiField === 'techStack'}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {activeAiField === 'techStack' ? <Loader2 size={14} className="inline mr-2 animate-spin" /> : <Wand2 size={14} className="inline mr-2" />}
              AI Recommend
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            [
              { key: 'frontend', label: 'Frontend' },
              { key: 'css', label: 'CSS Framework' },
              { key: 'backend', label: 'Backend' }
            ],
            [
              { key: 'llm', label: 'LLM Engine' },
              { key: 'mcp', label: 'MCP Integrations' },
              { key: 'testing', label: 'Testing' }
            ],
            [
              { key: 'deployment', label: 'Deployment' },
              { key: 'reporting', label: 'Enterprise Reporting' },
              { key: 'apis', label: 'APIs' }
            ],
            [
              { key: 'localLlm', label: 'Local LLM' },
              { key: 'evalTools', label: 'Eval Tools' },
              { key: 'additional', label: 'Additional Tools' }
            ]
          ].map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-3 gap-3">
              {row.map(({ key, label }) => (
                <TechStackSelect
                  key={key}
                  label={label}
                  selected={formData.selectedTechStack[key]}
                  options={TECH_STACK_OPTIONS[key] || []}
                  onChange={(val) => handleNestedChange('selectedTechStack', key, val)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Justifications (Section 2.3) */}
      <TechJustificationsSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateTechJustifications={generateTechJustifications}
      />

      {/* Database Architecture (Section 2.4) */}
      <DatabaseArchSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        handleArrayItemUpdate={handleArrayItemUpdate}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateDatabaseArchitecture={generateDatabaseArchitecture}
      />

      {/* Security & Compliance (Section 2.5) */}
      <SecurityComplianceSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateSecurityCompliance={generateSecurityCompliance}
      />

      {/* Performance & Scalability (Section 2.6) */}
      <PerformanceSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generatePerformanceTargets={generatePerformanceTargets}
      />

      {/* Competitor Discovery */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-lg font-bold text-blue-900">
            <Sparkles size={20} className="mr-2" />
            Competitor Discovery
            <HelpTooltip text={HELP_TEXTS.competitors} />
          </label>
          <button
            onClick={aiDiscoverCompetitors}
            disabled={activeAiField === 'competitors'}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {activeAiField === 'competitors' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
            AI Enhance
          </button>
        </div>

        <div className="space-y-4">
          {formData.competitors.map((comp, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => updateCompetitor(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
                  placeholder={`Competitor ${idx + 1}`}
                />
                <input
                  type="text"
                  value={comp.url}
                  onChange={(e) => updateCompetitor(idx, 'url', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="URL"
                  readOnly
                />
                <button
                  onClick={() => aiDiscoverPainpoints(idx)}
                  disabled={activeAiField !== null || discoveringPainpoints[idx] || !comp.name}
                  className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
                  title="Extract pain points from G2, TrustRadius & SourceForge"
                >
                  {discoveringPainpoints[idx] ? <Loader2 size={14} className="inline mr-1 animate-spin" /> : <Search size={14} className="inline mr-1" />}
                  Discover
                </button>
              </div>
              <textarea
                value={comp.analysis}
                onChange={(e) => updateCompetitor(idx, 'analysis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                rows={comp.analysis && comp.analysis.includes('G2') ? 8 : 2}
                placeholder="Analysis — click Discover to extract pain points from G2, TrustRadius & SourceForge..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Positioning (Section 2.7) */}
      <CompetitivePositionSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateCompetitivePositioning={generateCompetitivePositioning}
      />
    </div>
  );

  // Step 2: Visual Style Guide (continued in next part due to length)
  const renderStep2 = () => (
    <div className="space-y-8 bg-blue-50 p-6 rounded-2xl">
      {/* Complete Style Preview - Moved to Top */}
      <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
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
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
          Logo & Brand Photography
          <HelpTooltip text={HELP_TEXTS.logo} />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all">
            {formData.primaryLogo ? (
              <img src={formData.primaryLogo.base64} alt="Primary Logo" className="w-16 h-16 object-contain mb-2" />
            ) : (
              <Upload size={32} className="text-gray-400 mb-2" />
            )}
            <span className="font-medium text-gray-700 text-sm mb-1">Primary Logo</span>
            <span className="text-xs text-gray-500">SVG, PNG, JPG</span>
            <input type="file" accept=".svg,.png,.jpg" onChange={(e) => handleLogoUpload(e, 'primary')} className="hidden" />
          </label>

          <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all">
            {formData.secondaryLogo ? (
              <img src={formData.secondaryLogo.base64} alt="Secondary Logo" className="w-16 h-16 object-contain mb-2" />
            ) : (
              <Upload size={32} className="text-gray-400 mb-2" />
            )}
            <span className="font-medium text-gray-700 text-sm mb-1">Secondary/Icon</span>
            <span className="text-xs text-gray-500">For favicons</span>
            <input type="file" accept=".svg,.png,.jpg,.ico" onChange={(e) => handleLogoUpload(e, 'secondary')} className="hidden" />
          </label>

          <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all">
            <Camera size={32} className="text-gray-400 mb-2" />
            <span className="font-medium text-gray-700 text-sm mb-1">UI Mockups</span>
            <span className="text-xs text-gray-500">Screenshots / mockups</span>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" multiple />
          </label>
        </div>
        {formData.uploadedPhotos.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-500">{formData.uploadedPhotos.length} mockup(s) uploaded — used in UI Preview Templates</div>
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
          Color Palette
          <HelpTooltip text={HELP_TEXTS.colors} />
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
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${calculateContrast(formData[key], '#FFFFFF') === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {calculateContrast(formData[key], '#FFFFFF')}
                  </div>
                </div>
                <div className="relative p-3 rounded-lg" style={{ backgroundColor: formData[key] }}>
                  <div className="text-black text-sm font-medium">Black Text</div>
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${calculateContrast(formData[key], '#000000') === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
          Typography
          <HelpTooltip text={HELP_TEXTS.typography} />
        </label>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
            <label className="block text-sm font-bold text-blue-900 mb-3">Body Font</label>
            <div className="flex items-center gap-4">
              <select
                value={formData.primaryFont}
                onChange={(e) => handleInputChange('primaryFont', e.target.value)}
                className="w-48 px-4 py-3 bg-white border-2 border-blue-200 rounded-lg outline-none"
              >
                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
              <div className="px-3 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 whitespace-nowrap" style={{ fontFamily: formData.primaryFont }}>
                BuLLM Coding System
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
            <label className="block text-sm font-bold text-blue-900 mb-3">Heading Font</label>
            <div className="flex items-center gap-4">
              <select
                value={formData.headingsFont}
                onChange={(e) => handleInputChange('headingsFont', e.target.value)}
                className="w-48 px-4 py-3 bg-white border-2 border-blue-200 rounded-lg outline-none"
              >
                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
              <div className="px-3 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-bold whitespace-nowrap" style={{ fontFamily: formData.headingsFont }}>
                BuLLM Coding System
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heading Styles - With Previews */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
          Heading Styles
          <HelpTooltip text={HELP_TEXTS.headingSizes} />
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
                  DigiBull AI
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Type Scale System (Section 3.2) */}
      <TypeScaleSection
        formData={formData}
        handleInputChange={handleInputChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateDesignSystem={generateDesignSystem}
      />

      {/* Component Specifications (Section 3.2) */}
      <ComponentSpecsSection
        formData={formData}
        handleInputChange={handleInputChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateDesignSystem={generateDesignSystem}
      />

      {/* Chart & Data Visualization */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5</span>
          Chart & Data Visualization
          <HelpTooltip text={HELP_TEXTS.charts} />
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
                  disabled={activeAiField === 'chartGuidelines'}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {activeAiField === 'chartGuidelines' ? 'Processing...' : 'AI Enhance'}
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

      {/* UI Mockup & Screenshots */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
          UI Mockup & Screenshots
        </label>
        <p className="text-sm text-gray-500 mb-4">Upload up to 4 UI mockups or screenshots that reflect your desired look & feel. These will appear in the UI Preview Templates below.</p>
        <div className="grid grid-cols-2 gap-6">
          {/* Upload area */}
          <label className="cursor-pointer flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
            <Upload size={36} className="text-gray-400 mb-3" />
            <span className="font-semibold text-gray-700 text-sm mb-1">Drop mockups or click to upload</span>
            <span className="text-xs text-gray-500">PNG, JPG, SVG — max 4 images</span>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" multiple />
          </label>

          {/* 2x2 Preview grid */}
          <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Uploaded Mockups {formData.uploadedPhotos.length > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({formData.uploadedPhotos.length}/4)</span>}</div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const item = formData.uploadedPhotos[idx];
                return item?.base64 ? (
                  <div key={item.id || idx} className="relative group">
                    <img
                      src={item.base64}
                      alt={item.name || `Mockup ${idx + 1}`}
                      className="h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setViewingPhoto(item)}
                      title="Click to view"
                    />
                    <button
                      onClick={() => removeFile('uploadedPhotos', idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={10} className="inline mr-0.5" />View
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center">
                    <Camera size={16} className="text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-300">Screen {idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Layout (Section 3.3) */}
      <DashboardLayoutSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
      />

      {/* UX Guidelines (Section 3.4) */}
      <UXGuidelinesSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateUXGuidelines={generateUXGuidelines}
      />

      {/* Responsive Design (Section 3.5) */}
      <ResponsiveDesignSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateUXGuidelines={generateUXGuidelines}
      />

      {/* UI Preview Templates */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Eye size={20} className="mr-2" />
            UI Preview Templates
            {selectedTemplateIdx !== null && uiTemplates?.[selectedTemplateIdx] && (
              <span className="ml-3 text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Selected: {uiTemplates[selectedTemplateIdx].templateName}
              </span>
            )}
          </h4>
          <div className="flex items-center gap-2">
            {templatesMinimized && uiTemplates && (
              <button
                onClick={() => setTemplatesMinimized(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <ChevronDown size={16} />
                Expand
              </button>
            )}
            <button
              onClick={handleGenerateUITemplates}
              disabled={generatingTemplates || aiEnhancing}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                generatingTemplates
                  ? 'bg-purple-100 text-purple-500 cursor-wait'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:from-purple-600 hover:to-indigo-600'
              }`}
            >
              {generatingTemplates ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generatingTemplates ? 'Generating...' : 'Generate Previews'}
            </button>
          </div>
        </div>
        {!templatesMinimized && (
          <p className="text-sm text-gray-500 mb-5">AI-generated UI templates based on your app concept, platform, and audience. {formData.uploadedPhotos.length > 0 ? `Your ${formData.uploadedPhotos.length} uploaded mockup(s) will be reflected in the preview screens.` : 'Upload UI mockups above to see them in the preview screens, or AI placeholders will be used.'}</p>
        )}

        {!templatesMinimized && !uiTemplates && !generatingTemplates && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <Eye size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Click "Generate Previews" to create UI templates based on your Step 1 & 2 inputs</p>
          </div>
        )}

        {!templatesMinimized && generatingTemplates && (
          <div className="border-2 border-dashed border-purple-200 rounded-xl p-12 text-center bg-purple-50">
            <Loader2 size={48} className="mx-auto text-purple-400 mb-3 animate-spin" />
            <p className="text-purple-500 text-sm font-medium">Designing UI templates for your app...</p>
          </div>
        )}

        {!templatesMinimized && uiTemplates && uiTemplates.length > 0 && !generatingTemplates && (() => {
          // Determine image sources: user photos/logo or AI gradient placeholders
          const hasLogo = formData.primaryLogo?.base64;
          const hasPhotos = formData.uploadedPhotos.length > 0;
          const userPhotos = formData.uploadedPhotos.filter(p => p.base64).map(p => p.base64);
          const logoSrc = hasLogo ? formData.primaryLogo.base64 : null;

          return (
          <div className="space-y-8">
            {uiTemplates.map((template, tIdx) => {
              const accentColors = {
                cool: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', wireframeBg: '#EFF6FF', wireframeAccent: formData.primaryColor || '#3B82F6', secondary: formData.secondaryColor || '#06B6D4' },
                warm: { gradient: 'from-orange-500 to-rose-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', wireframeBg: '#FFF7ED', wireframeAccent: formData.primaryColor || '#F97316', secondary: formData.secondaryColor || '#F43F5E' },
                neutral: { gradient: 'from-slate-500 to-gray-600', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-700', wireframeBg: '#F9FAFB', wireframeAccent: formData.primaryColor || '#6B7280', secondary: formData.secondaryColor || '#475569' },
              };
              const accent = accentColors[template.colorAccent] || accentColors.cool;

              // Image slot: user photo → AI-relevant stock image → gradient fallback
              const queries = template.imageQueries || [];
              const gradientFallbacks = [
                `linear-gradient(135deg, ${accent.wireframeAccent}30, ${accent.secondary}25)`,
                `linear-gradient(45deg, ${accent.secondary}20, ${accent.wireframeAccent}35)`,
                `radial-gradient(circle at 30% 40%, ${accent.wireframeAccent}25, ${accent.secondary}15, transparent 70%)`,
                `linear-gradient(160deg, ${accent.wireframeAccent}15 0%, ${accent.secondary}30 50%, ${accent.wireframeAccent}20 100%)`,
              ];

              // Image slot with gradient fallback behind the img
              const ImageSlot = ({ idx, className = '', style = {} }) => {
                const photoIdx = (tIdx * 3 + idx) % Math.max(userPhotos.length, 1);
                if (hasPhotos && userPhotos[photoIdx]) {
                  return <img src={userPhotos[photoIdx]} alt="" className={`object-cover ${className}`} style={style} />;
                }
                const keyword = queries[idx % queries.length] || formData.appName || 'technology';
                const encodedKeyword = encodeURIComponent(keyword);
                const imgUrl = `https://loremflickr.com/400/250/${encodedKeyword}?lock=${tIdx * 10 + idx}`;
                const fallbackBg = gradientFallbacks[idx % gradientFallbacks.length];
                return (
                  <div className={`relative ${className}`} style={style}>
                    {/* Gradient shown behind while image loads, and as fallback */}
                    <div className="absolute inset-0" style={{ background: fallbackBg, borderRadius: style.borderRadius || 0 }} />
                    <img
                      src={imgUrl}
                      alt={keyword}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ borderRadius: style.borderRadius || 0 }}
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                );
              };

              // Logo slot: user logo or styled initials
              const getLogoSlot = (size = 24) => {
                if (logoSrc) {
                  return <img src={logoSrc} alt="" className="object-contain" style={{ width: size, height: size, borderRadius: 4 }} />;
                }
                return (
                  <div className="flex items-center justify-center font-bold text-white rounded" style={{ width: size, height: size, background: accent.wireframeAccent, fontSize: size * 0.4 }}>
                    {(formData.appName || 'A').charAt(0).toUpperCase()}
                  </div>
                );
              };

              return (
                <div key={tIdx} className={`border-2 ${accent.border} rounded-2xl overflow-hidden shadow-sm`}>
                  {/* Template Header */}
                  <div className={`bg-gradient-to-r ${accent.gradient} px-6 py-5 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      {getLogoSlot(36)}
                      <div>
                        <h5 className="text-white font-bold text-lg">{template.templateName}</h5>
                        <p className="text-white/80 text-sm mt-0.5">{template.bestFit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Template {tIdx + 1}
                      </span>
                      <button
                        onClick={() => { setSelectedTemplateIdx(tIdx); setTemplatesMinimized(true); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedTemplateIdx === tIdx
                            ? 'bg-white text-green-700 shadow-md'
                            : 'bg-white/30 text-white hover:bg-white/50 backdrop-blur-sm'
                        }`}
                      >
                        {selectedTemplateIdx === tIdx ? <><Check size={12} className="inline mr-1" />Selected</> : 'Select'}
                      </button>
                    </div>
                  </div>

                  {/* Screens Preview */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-5 mb-6">
                      {(template.screens || []).slice(0, 3).map((screen, sIdx) => {
                        const a = accent.wireframeAccent;
                        const s = accent.secondary;
                        const rd = "rounded-md";

                        // Larger wireframes with image/logo integration
                        const renderWireframe = (type) => {
                          switch (type) {
                            case 'dashboard':
                              return (
                                <div className="flex gap-1.5 h-full">
                                  <div className={`w-1/4 ${rd} flex flex-col items-center pt-2 gap-2`} style={{ background: a, opacity: 0.12 }}>
                                    {getLogoSlot(18)}
                                    {[1,2,3,4].map(i => <div key={i} className="w-3/4 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />)}
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5">
                                    <div className={`h-5 ${rd} flex items-center px-2 justify-between`} style={{ background: a, opacity: 0.08 }}>
                                      <div className="w-12 h-2 rounded" style={{ background: a, opacity: 0.2 }} />
                                      <div className="w-5 h-5 rounded-full" style={{ background: a, opacity: 0.15 }} />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                                      <div className={`${rd} p-1.5 flex flex-col justify-between`} style={{ background: a, opacity: 0.06 }}>
                                        <div className="w-8 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />
                                        <div className="text-center font-bold" style={{ color: a, opacity: 0.3, fontSize: 10 }}>248</div>
                                      </div>
                                      <div className={`${rd} overflow-hidden`}>
                                        <ImageSlot idx={sIdx} className="w-full h-full" style={{ borderRadius: 6 }} />
                                      </div>
                                      <div className={`${rd} overflow-hidden`}>
                                        <ImageSlot idx={sIdx + 1} className="w-full h-full" style={{ borderRadius: 6 }} />
                                      </div>
                                      <div className={`${rd} p-1.5 flex flex-col justify-between`} style={{ background: s, opacity: 0.08 }}>
                                        <div className="w-6 h-1.5 rounded" style={{ background: s, opacity: 0.25 }} />
                                        <div className="w-full h-2 rounded" style={{ background: s, opacity: 0.15 }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            case 'kanban':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center justify-between px-2`} style={{ background: a, opacity: 0.1 }}>
                                    {getLogoSlot(14)}
                                    <div className="flex gap-1">{[1,2,3].map(i=><div key={i} className="w-4 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />)}</div>
                                  </div>
                                  <div className="flex-1 flex gap-1.5">
                                    {[0.06, 0.08, 0.06].map((o, i) => (
                                      <div key={i} className={`flex-1 flex flex-col gap-1 p-1.5 ${rd}`} style={{ background: a, opacity: o }}>
                                        <div className="h-2 w-2/3 rounded" style={{ background: a, opacity: 0.2 }} />
                                        {[1,2,3].map(j => (
                                          <div key={j} className={`${rd} p-1`} style={{ background: '#fff', opacity: 0.8 }}>
                                            <div className="h-1 w-3/4 rounded mb-0.5" style={{ background: a, opacity: 0.15 }} />
                                            <div className="h-1 w-1/2 rounded" style={{ background: a, opacity: 0.1 }} />
                                          </div>
                                        ))}
                                        {i === 1 && <div className={`${rd} overflow-hidden h-8`}><ImageSlot idx={sIdx} className="w-full h-full" style={{ borderRadius: 4 }} /></div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            case 'hero':
                            case 'landing':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center justify-between px-2`} style={{ background: a, opacity: 0.08 }}>
                                    {getLogoSlot(14)}
                                    <div className="flex gap-1">{[1,2,3,4].map(i=><div key={i} className="w-4 h-1.5 rounded" style={{ background: a, opacity: 0.15 }} />)}</div>
                                  </div>
                                  <div className={`flex-1 ${rd} flex overflow-hidden`}>
                                    <div className="w-1/2 flex flex-col justify-center gap-1.5 p-2">
                                      <div className="h-2.5 w-4/5 rounded" style={{ background: a, opacity: 0.25 }} />
                                      <div className="h-1.5 w-full rounded" style={{ background: a, opacity: 0.1 }} />
                                      <div className="h-1.5 w-3/4 rounded" style={{ background: a, opacity: 0.1 }} />
                                      <div className="h-4 w-14 rounded mt-1" style={{ background: a, opacity: 0.25 }} />
                                    </div>
                                    <div className="w-1/2 overflow-hidden" style={{ borderRadius: 6 }}>
                                      <ImageSlot idx={sIdx} className="w-full h-full" style={{}} />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 h-10">
                                    {[0, 1, 2].map((i) => (
                                      <div key={i} className={`${rd} p-1.5 flex flex-col items-center justify-center`} style={{ background: a, opacity: 0.05 }}>
                                        <div className="w-3 h-3 rounded-full mb-0.5" style={{ background: a, opacity: 0.15 }} />
                                        <div className="w-3/4 h-1 rounded" style={{ background: a, opacity: 0.1 }} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            case 'table':
                            case 'list':
                              return (
                                <div className="flex flex-col gap-1 h-full">
                                  <div className={`h-6 ${rd} flex items-center justify-between px-2`} style={{ background: a, opacity: 0.1 }}>
                                    {getLogoSlot(14)}
                                    <div className="flex gap-1">
                                      <div className="w-12 h-2.5 rounded" style={{ background: a, opacity: 0.08 }} />
                                      <div className="w-5 h-2.5 rounded" style={{ background: a, opacity: 0.2 }} />
                                    </div>
                                  </div>
                                  <div className={`h-4 ${rd} flex items-center gap-2 px-2`} style={{ background: a, opacity: 0.15 }}>
                                    {['25%','35%','20%','20%'].map((w,i)=><div key={i} className="h-1.5 rounded" style={{ width: w, background: '#fff', opacity: 0.6 }} />)}
                                  </div>
                                  {[0.04, 0.02, 0.04, 0.02, 0.04].map((o, i) => (
                                    <div key={i} className={`h-4 ${rd} flex items-center gap-2 px-2`} style={{ background: a, opacity: o }}>
                                      {i === 0 && <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0"><ImageSlot idx={sIdx} className="w-full h-full" style={{}} /></div>}
                                      {['25%','35%','20%','20%'].map((w,j)=><div key={j} className="h-1.5 rounded" style={{ width: w, background: a, opacity: 0.12 }} />)}
                                    </div>
                                  ))}
                                </div>
                              );
                            case 'analytics':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center justify-between px-2`} style={{ background: a, opacity: 0.08 }}>
                                    {getLogoSlot(14)}
                                    <div className="w-6 h-2.5 rounded" style={{ background: a, opacity: 0.15 }} />
                                  </div>
                                  <div className="flex gap-1.5 h-8">
                                    {[a, s, a].map((c, i) => (
                                      <div key={i} className={`flex-1 ${rd} p-1.5 flex flex-col justify-between`} style={{ background: c, opacity: 0.07 }}>
                                        <div className="w-6 h-1 rounded" style={{ background: c, opacity: 0.25 }} />
                                        <div className="font-bold" style={{ color: c, opacity: 0.3, fontSize: 9 }}>{['1.2K','89%','$4.5K'][i]}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className={`flex-1 ${rd} p-1.5`} style={{ background: a, opacity: 0.04 }}>
                                    <div className="flex items-end h-full gap-1 px-1">
                                      {[55,75,40,90,65,50,80,60,85,45].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 === 0 ? a : s, opacity: 0.2 }} />
                                      ))}
                                    </div>
                                  </div>
                                  <div className={`h-6 ${rd} overflow-hidden`}><ImageSlot idx={sIdx + 2} className="w-full h-full" style={{ borderRadius: 6 }} /></div>
                                </div>
                              );
                            case 'form':
                            case 'detail':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center px-2 gap-2`} style={{ background: a, opacity: 0.1 }}>
                                    {getLogoSlot(14)}
                                    <div className="w-10 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />
                                  </div>
                                  <div className="flex gap-1.5 flex-1">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                      {[1,2,3].map(i => (
                                        <div key={i} className="flex flex-col gap-0.5">
                                          <div className={`h-2 w-1/3 ${rd}`} style={{ background: a, opacity: 0.15 }} />
                                          <div className={`h-4 ${rd}`} style={{ background: a, opacity: 0.05 }} />
                                        </div>
                                      ))}
                                      <div className={`h-5 w-1/3 ${rd} mt-auto`} style={{ background: a, opacity: 0.25 }} />
                                    </div>
                                    <div className={`w-1/3 ${rd} overflow-hidden`}>
                                      <ImageSlot idx={sIdx} className="w-full h-full" style={{ borderRadius: 6 }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            case 'settings':
                            case 'profile':
                              return (
                                <div className="flex gap-1.5 h-full">
                                  <div className={`w-1/3 ${rd} flex flex-col gap-1.5 p-2`} style={{ background: a, opacity: 0.05 }}>
                                    {getLogoSlot(16)}
                                    {[1,2,3,4,5,6].map(i => <div key={i} className={`h-2 ${rd}`} style={{ background: a, opacity: i === 2 ? 0.2 : 0.08 }} />)}
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5">
                                    <div className={`h-6 ${rd} flex items-center px-2 justify-between`} style={{ background: a, opacity: 0.06 }}>
                                      <div className="w-10 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />
                                      <div className="w-5 h-5 rounded-full overflow-hidden"><ImageSlot idx={sIdx} className="w-full h-full" style={{}} /></div>
                                    </div>
                                    <div className={`h-16 ${rd} overflow-hidden`}><ImageSlot idx={sIdx + 1} className="w-full h-full" style={{ borderRadius: 6 }} /></div>
                                    <div className={`flex-1 ${rd} p-1.5 flex flex-col gap-1`} style={{ background: a, opacity: 0.04 }}>
                                      {[1,2,3].map(i => (
                                        <div key={i} className="flex items-center justify-between">
                                          <div className="w-1/3 h-1.5 rounded" style={{ background: a, opacity: 0.12 }} />
                                          <div className="w-6 h-3 rounded-full" style={{ background: i === 1 ? a : '#ddd', opacity: 0.25 }} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            case 'chat':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center px-2 gap-2`} style={{ background: a, opacity: 0.1 }}>
                                    {getLogoSlot(14)}
                                    <div className="w-12 h-1.5 rounded" style={{ background: a, opacity: 0.2 }} />
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5 px-1">
                                    <div className="flex gap-1 items-end">
                                      <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0"><ImageSlot idx={0} className="w-full h-full" style={{}} /></div>
                                      <div className={`${rd} px-2 py-1 max-w-[70%]`} style={{ background: a, opacity: 0.08 }}><div className="h-1 w-10 rounded" style={{ background: a, opacity: 0.15 }} /><div className="h-1 w-6 rounded mt-0.5" style={{ background: a, opacity: 0.1 }} /></div>
                                    </div>
                                    <div className="flex gap-1 items-end justify-end">
                                      <div className={`${rd} px-2 py-1 max-w-[70%]`} style={{ background: a, opacity: 0.18 }}><div className="h-1 w-12 rounded" style={{ background: '#fff', opacity: 0.5 }} /></div>
                                    </div>
                                    <div className="flex gap-1 items-end">
                                      <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0"><ImageSlot idx={1} className="w-full h-full" style={{}} /></div>
                                      <div className={`${rd} overflow-hidden h-10 w-16`}><ImageSlot idx={sIdx} className="w-full h-full" style={{ borderRadius: 6 }} /></div>
                                    </div>
                                  </div>
                                  <div className={`h-5 ${rd} flex items-center px-2 gap-1`} style={{ background: a, opacity: 0.06 }}>
                                    <div className="flex-1 h-2.5 rounded" style={{ background: a, opacity: 0.06 }} />
                                    <div className="w-5 h-3 rounded" style={{ background: a, opacity: 0.2 }} />
                                  </div>
                                </div>
                              );
                            case 'calendar':
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center justify-between px-2`} style={{ background: a, opacity: 0.08 }}>
                                    {getLogoSlot(14)}
                                    <div className="flex gap-0.5">{['Mo','Tu','We'].map(d=><span key={d} style={{ fontSize: 6, color: a, opacity: 0.3 }}>{d}</span>)}</div>
                                  </div>
                                  <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-0.5">
                                    {Array.from({length: 35}, (_, i) => (
                                      <div key={i} className={rd} style={{ background: [3,11,17,24].includes(i) ? a : a, opacity: [3,11,17,24].includes(i) ? 0.2 : 0.04, position: 'relative' }}>
                                        {i === 11 && <div className="absolute inset-0 overflow-hidden rounded"><ImageSlot idx={sIdx} className="w-full h-full" style={{}} /></div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            default:
                              return (
                                <div className="flex flex-col gap-1.5 h-full">
                                  <div className={`h-6 ${rd} flex items-center px-2 gap-2`} style={{ background: a, opacity: 0.1 }}>
                                    {getLogoSlot(14)}
                                    <div className="w-10 h-1.5 rounded" style={{ background: a, opacity: 0.15 }} />
                                  </div>
                                  <div className={`flex-1 ${rd} overflow-hidden`}><ImageSlot idx={sIdx} className="w-full h-full" style={{ borderRadius: 6 }} /></div>
                                  <div className={`h-8 ${rd}`} style={{ background: a, opacity: 0.06 }} />
                                </div>
                              );
                          }
                        };

                        return (
                          <div key={sIdx} className={`${accent.bg} rounded-xl overflow-hidden border ${accent.border} shadow-sm`}>
                            {/* Wireframe — larger */}
                            <div className="h-56 p-3" style={{ background: accent.wireframeBg }}>
                              {renderWireframe(screen.type)}
                            </div>
                            {/* Screen info */}
                            <div className="px-4 py-3 border-t" style={{ borderColor: accent.wireframeAccent + '20' }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-800">{screen.name}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${accent.badge}`}>{screen.type}</span>
                              </div>
                              <div className="space-y-1">
                                {(screen.sections || []).slice(0, 5).map((sec, secIdx) => (
                                  <div key={secIdx} className="flex items-center text-xs text-gray-500">
                                    <div className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" style={{ background: accent.wireframeAccent, opacity: 0.5 }} />
                                    {sec}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Components & Meta */}
                    <div className="flex flex-wrap gap-2">
                      {(template.components || []).map((comp, cIdx) => (
                        <span key={cIdx} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${accent.badge}`}>
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>
    </div>
  );

  // Step 3: Generate PRD
  const renderStep3 = () => (
    <div className="space-y-6 bg-blue-50 p-6 rounded-2xl">
      {/* Timeline & Project Details */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
          Timeline & Project Details
          <HelpTooltip text={HELP_TEXTS.timeline} />
        </label>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Type</label>
            <select
              value={formData.projectType}
              onChange={(e) => handleInputChange('projectType', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-400"
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-400"
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

      {/* Development Phases & Roadmap (Section 4.1 + 4.2) */}
      <DevPhasesSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        handleArrayItemUpdate={handleArrayItemUpdate}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateDevPhases={generateDevPhases}
        generateImplementationRoadmap={generateImplementationRoadmap}
      />

      {/* Testing Strategy (Section 4.3) */}
      <TestingStrategySection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateTestingStrategy={generateTestingStrategy}
      />

      {/* Deployment Strategy (Section 4.4) */}
      <DeploymentSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateDeploymentStrategy={generateDeploymentStrategy}
      />

      {/* Budget, Resources & Documentation (Section 4.5 + 4.6) */}
      <BudgetResourceSection
        formData={formData}
        handleInputChange={handleInputChange}
        handleNestedChange={handleNestedChange}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        handleArrayItemUpdate={handleArrayItemUpdate}
        showNotification={showNotification}
        activeAiField={activeAiField}
        generateBudgetEstimation={generateBudgetEstimation}
        generateDocumentationPlan={generateDocumentationPlan}
      />

      {/* Smart Validation */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 flex items-center">
            <Shield size={20} className="mr-2" />
            Smart Validation
          </h4>
          <button
            onClick={runValidation}
            disabled={validating || aiEnhancing}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {validating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {validating ? 'Validating...' : 'Validate PRD'}
          </button>
        </div>
        {validationResults.dependencies && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sm font-semibold text-gray-700">PRD Completeness:</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${(validationResults.dependencies.completeness || 0) >= 80 ? 'bg-green-500' : (validationResults.dependencies.completeness || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${validationResults.dependencies.completeness || 0}%` }}
                />
              </div>
              <div className="text-sm font-bold text-gray-700">{validationResults.dependencies.completeness || 0}%</div>
            </div>
          </div>
        )}
        {Object.values(validationResults).some(v => v) && (
          <div className="space-y-2">
            {validationResults.techStack?.warnings?.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs font-bold text-yellow-800 mb-1">Tech Stack Warnings</div>
                {validationResults.techStack.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-yellow-700">- {w}</div>
                ))}
              </div>
            )}
            {validationResults.timeline?.warnings?.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs font-bold text-yellow-800 mb-1">Timeline Warnings</div>
                {validationResults.timeline.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-yellow-700">- {w}</div>
                ))}
              </div>
            )}
            {validationResults.budget?.warnings?.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs font-bold text-yellow-800 mb-1">Budget Warnings</div>
                {validationResults.budget.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-yellow-700">- {w}</div>
                ))}
              </div>
            )}
            {validationResults.dependencies?.missingDependencies?.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-xs font-bold text-orange-800 mb-1">Missing Dependencies</div>
                {validationResults.dependencies.missingDependencies.map((d, i) => (
                  <div key={i} className="text-xs text-orange-700">- {d}</div>
                ))}
              </div>
            )}
            {validationResults.dependencies?.suggestions?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs font-bold text-blue-800 mb-1">Suggestions</div>
                {validationResults.dependencies.suggestions.map((s, i) => (
                  <div key={i} className="text-xs text-blue-700">- {s}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {!Object.values(validationResults).some(v => v) && (
          <p className="text-xs text-gray-500">Click "Validate PRD" to run tech stack compatibility, timeline feasibility, budget, and dependency checks.</p>
        )}
      </div>

      {/* BuLLM PRD Review Checklist */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
          <FileCheck size={20} className="mr-2" />
          BuLLM PRD Review Checklist
          <HelpTooltip text={HELP_TEXTS.prdReview} />
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {[...PRD_REVIEW_CHECKLIST, ...EXTENDED_PRD_REVIEW_CHECKLIST].map(item => (
            <label key={item.id} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-500 rounded mr-2 flex-shrink-0"
                checked={prdReviewChecked[item.id] || false}
                onChange={(e) => setPrdReviewChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              />
              <div className="min-w-0">
                <div
                  className={`text-xs font-medium truncate ${formData.generatedPRD ? 'text-blue-700 hover:underline cursor-pointer' : 'text-gray-800'}`}
                  onClick={(e) => { if (formData.generatedPRD && item.prdSearch) { e.preventDefault(); highlightPrdSection(item.prdSearch); } }}
                >
                  {item.label}
                </div>
                <div className="text-[10px] text-gray-500">{item.category}</div>
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
        <div className="grid grid-cols-4 gap-4">
          <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all">
            <Download size={32} className="mx-auto mb-3 text-purple-600" />
            <div className="font-bold text-purple-900 mb-1">1. Scope of Work</div>
            <div className="text-xs text-purple-700 mb-3">Export as PDF or DOC</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => downloadScopeOfWork('pdf')}
                className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-all"
              >
                PDF
              </button>
              <button
                onClick={() => downloadScopeOfWork('docx')}
                className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 transition-all"
              >
                DOC
              </button>
            </div>
          </div>

          <button
            onClick={generatePRD}
            disabled={activeAiField === 'generatePRD'}
            className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {activeAiField === 'generatePRD' ? (
              <Loader2 size={32} className="mx-auto mb-3 text-blue-600 animate-spin" />
            ) : (
              <FileText size={32} className="mx-auto mb-3 text-blue-600" />
            )}
            <div className="font-bold text-blue-900 mb-1">2. Generate PRD</div>
            <div className="text-xs text-blue-700">Create comprehensive document</div>
          </button>

          <button
            onClick={() => setShowTemplateDialog(true)}
            disabled={!formData.generatedPRD}
            className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Send size={32} className="mx-auto mb-3 text-green-600" />
            <div className="font-bold text-green-900 mb-1">3. Sales Proposal</div>
            <div className="text-xs text-green-700">Convert to proposal</div>
          </button>

          <button
            onClick={() => {
              if (!formData.generatedPRD) {
                showNotification('Generate the PRD first', 'error');
                return;
              }
              const guide = [
                `# Implementation Guide - ${formData.appName || 'Untitled App'}`,
                `Generated: ${new Date().toLocaleDateString()}\n`,
                '## Dev Team Handoff',
                formData.implementationGuide?.devTeamHandoff || 'Review the generated PRD and development phases for full handoff details.',
                '\n## Project Management Templates',
                formData.implementationGuide?.pmTemplates || 'Use the development phases and milestones defined in the PRD as sprint planning inputs.',
                '\n## Success Metrics Tracking',
                formData.implementationGuide?.successMetricsTracking || 'Track activation, engagement, and business KPIs as defined in the Success Metrics section.',
                '\n## Development Phases',
                ...(formData.developmentPhases || []).map((p, i) => `### Phase ${i + 1}: ${p.phaseName}\nDeliverables: ${(p.deliverables || []).join(', ')}\nDependencies: ${(p.dependencies || []).join(', ')}`),
                '\n## Testing Checklist',
                `- Unit Testing Target: ${formData.testingStrategy?.unitTesting?.target || 'TBD'}`,
                `- Integration Testing: ${formData.testingStrategy?.integrationTesting?.specs || 'TBD'}`,
                `- E2E Critical Paths: ${(formData.testingStrategy?.e2eTesting?.criticalPaths || []).join(', ') || 'TBD'}`,
                '\n## Deployment Checklist',
                `- CI/CD: ${formData.deploymentStrategy?.cicdPipeline || 'TBD'}`,
                `- Monitoring: ${formData.deploymentStrategy?.monitoring || 'TBD'}`,
                `- Launch: ${formData.launchPlan?.publicLaunchTimeline || 'TBD'}`
              ].join('\n');
              const blob = new Blob([guide], { type: 'text/markdown' });
              downloadBlob(blob, `${formData.appName || 'implementation'}-guide.md`);
              showNotification('Implementation guide downloaded!', 'success');
            }}
            disabled={!formData.generatedPRD}
            className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <BookOpen size={32} className="mx-auto mb-3 text-amber-600" />
            <div className="font-bold text-amber-900 mb-1">4. Implementation Guide</div>
            <div className="text-xs text-amber-700">Dev team handoff package</div>
          </button>
        </div>
      </div>

      {/* PRD Display */}
      {formData.generatedPRD && (
        <>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 relative" ref={prdContentRef}>
            <div className="absolute top-4 right-4 text-xs text-gray-300 font-mono">
              ISTVON PRD Framework
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {highlightedSection ? (() => { let found = false; return formData.generatedPRD.split('\n').map((line, i) => {
                const isMatch = line.toLowerCase().includes(highlightedSection.toLowerCase());
                const isFirst = isMatch && !found;
                if (isFirst) found = true;
                return <span key={i} className={isMatch ? 'bg-yellow-200 font-bold' : ''} {...(isFirst ? { 'data-highlight': 'true' } : {})}>{line}{'\n'}</span>;
              }); })() : formData.generatedPRD}
            </pre>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center">
              <Download size={20} className="mr-2" />
              Export PRD
              <HelpTooltip text={HELP_TEXTS.export} />
            </h4>
            <div className="flex gap-3">
              <button
                onClick={() => handleExportPRD('pdf')}
                disabled={isExporting}
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export as PDF'}
              </button>
              <button
                onClick={() => handleExportPRD('docx')}
                disabled={isExporting}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                Export as DOC
              </button>
              <button
                onClick={() => handleExportPRD('json')}
                disabled={isExporting}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExportPRD('md')}
                disabled={isExporting}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                Export as MD
              </button>
            </div>
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
                placeholder="Team member email (press Enter to add)"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
                onKeyPress={handleAddTeamMember}
              />
            </div>

            {formData.assignedTeam.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.assignedTeam.map((email, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {email}
                    <button
                      onClick={() => removeFromArray('assignedTeam', idx)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleSendToTeam}
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

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/bull-logo.png"
            alt="BuLL Logo"
            className="w-24 h-24 mx-auto mb-6 object-contain"
          />
          <h1 className="text-5xl font-black text-gray-900 mb-3">
            BuLLMake PRD Generator
          </h1>
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
                  {currentStep + 1}/{STEPS.length}
                </div>
                {autoSaveStatus === 'saving' && <span className="text-yellow-600 text-xs mt-1 block">Saving...</span>}
                {autoSaveStatus === 'saved' && <span className="text-green-600 text-xs mt-1 block">Saved</span>}
                {autoSaveStatus === 'error' && <span className="text-red-600 text-xs mt-1 block">Save failed</span>}
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
                className={`group flex items-center px-6 py-3 rounded-xl font-bold transition-all ${currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
                  }`}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep === STEPS.length - 1 ? (
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
          </div>

          {/* Footer Branding */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-600 font-medium">
              Powered by <span className="font-bold text-blue-600">BuLLM Coding System</span>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {formData.generatedPRD ? 'Generate Sales Proposal' : 'Use App Idea Template'}
              </h3>
              <button onClick={() => setShowTemplateDialog(false)} className="text-white hover:text-blue-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {formData.generatedPRD ? (
                <div className="space-y-4">
                  {/* Generate Buttons */}
                  <div className="flex gap-3">
                    {Object.entries(PROPOSAL_TEMPLATES).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => generateProposal(key)}
                        disabled={activeAiField === 'proposal'}
                        className={`flex-1 p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                          activeProposalTab === key && generatedProposalContent[key]
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        {activeAiField === 'proposal' && activeProposalTab === key ? (
                          <Loader2 size={20} className="mx-auto mb-2 animate-spin text-blue-500" />
                        ) : (
                          <Send size={20} className="mx-auto mb-2 text-blue-500" />
                        )}
                        <div className="font-bold text-gray-900 text-sm">{template.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Generated Content Display */}
                  {(generatedProposalContent.coverLetter || generatedProposalContent.salesProposal) && (
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      {/* Tabs */}
                      <div className="flex border-b border-gray-200">
                        <button
                          onClick={() => setActiveProposalTab('coverLetter')}
                          className={`flex-1 px-4 py-3 font-semibold text-sm ${
                            activeProposalTab === 'coverLetter'
                              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          disabled={!generatedProposalContent.coverLetter}
                        >
                          📧 Email Cover Letter
                        </button>
                        <button
                          onClick={() => setActiveProposalTab('salesProposal')}
                          className={`flex-1 px-4 py-3 font-semibold text-sm ${
                            activeProposalTab === 'salesProposal'
                              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          disabled={!generatedProposalContent.salesProposal}
                        >
                          📄 Sales Proposal
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {generatedProposalContent[activeProposalTab] ? (
                          <>
                            <div className="flex justify-end gap-2 mb-3">
                              <button
                                onClick={() => copyToClipboard(generatedProposalContent[activeProposalTab])}
                                className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                              >
                                <CheckCircle2 size={14} className="mr-1" />
                                Copy
                              </button>
                              <button
                                onClick={() => downloadProposal(generatedProposalContent[activeProposalTab], activeProposalTab)}
                                className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                              >
                                <Download size={14} className="mr-1" />
                                Download
                              </button>
                            </div>
                            <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto font-sans">
                              {generatedProposalContent[activeProposalTab]}
                            </pre>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Click a button above to generate {activeProposalTab === 'coverLetter' ? 'Cover Letter' : 'Sales Proposal'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs whitespace-pre-wrap">
                      {APP_IDEA_TEMPLATE}
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
                onClick={() => {
                  setShowTemplateDialog(false);
                  setGeneratedProposalContent({ coverLetter: '', salesProposal: '' });
                }}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              {!formData.generatedPRD && (
                <button
                  onClick={handleTemplateApply}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg"
                >
                  Apply Template
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={viewingPhoto.base64} alt={viewingPhoto.name || 'Photo'} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => setViewingPhoto(null)} className="w-8 h-8 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 font-bold">×</button>
            </div>
            {viewingPhoto.name && <div className="text-center text-white text-sm mt-3 opacity-75">{viewingPhoto.name}</div>}
          </div>
        </div>
      )}

      {/* AI Dialog */}
      {showUndoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
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
                <h4 className="font-semibold text-gray-700 mb-2">AI Enhanceed:</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
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
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg"
              >
                Accept Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Analysis Preview Dialog */}
      {showFileAnalysisDialog && pendingFileFields && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileCheck size={24} className="mr-3" />
                AI File Analysis — {Object.keys(pendingFileFields).length} Field{Object.keys(pendingFileFields).length > 1 ? 's' : ''} Found
              </h3>
              <p className="text-emerald-100 text-sm mt-1">Review extracted information before applying to your PRD</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-4">
              {coworkResult?.scannedFiles?.length > 0 && (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                  <div className="px-4 py-2 border-b border-blue-200">
                    <span className="font-semibold text-blue-700 text-sm">Extracted from {coworkResult.scannedFiles.length} file(s):</span>
                  </div>
                  <div className="px-4 py-2 flex flex-wrap gap-2">
                    {coworkResult.scannedFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 bg-white border border-blue-200 rounded text-xs text-gray-700">
                        <FileText size={12} className="mr-1 text-blue-500" />
                        {f.name}
                        <span className="ml-1 text-[10px] text-gray-400">({f.source})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Object.entries(pendingFileFields).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-700 text-sm">{fieldLabels[key] || key}</span>
                    {coworkResult?.fieldSources?.[key] && (
                      <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        from: {coworkResult.fieldSources[key]}
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">{value}</pre>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <span className="text-xs text-gray-500">Fields will overwrite empty form values only</span>
              <div className="flex space-x-3">
                <button
                  onClick={dismissFileAnalysis}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
                >
                  Dismiss
                </button>
                <button
                  onClick={acceptFileAnalysis}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg"
                >
                  Apply {Object.keys(pendingFileFields).length} Field{Object.keys(pendingFileFields).length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog - Backend Status */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Settings size={24} className="mr-3" />
                AI Backend Status
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Backend Server</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  backendStatus === 'ready' ? 'bg-green-100 text-green-700' :
                  backendStatus === 'checking' ? 'bg-yellow-100 text-yellow-700' :
                  backendStatus === 'not_configured' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {backendStatus === 'ready' ? 'Connected' :
                   backendStatus === 'checking' ? 'Checking...' :
                   backendStatus === 'not_configured' ? 'API Key Missing' :
                   'Not Running'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">AI Provider</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                  {provider}
                </span>
              </div>

              {backendStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <AlertCircle size={16} className="inline mr-2" />
                  Backend server is not running. Start it with:
                  <code className="block mt-2 p-2 bg-red-100 rounded text-xs">
                    cd backend && npm start
                  </code>
                </div>
              )}

              {backendStatus === 'not_configured' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <AlertCircle size={16} className="inline mr-2" />
                  API key not configured. Add your key to:
                  <code className="block mt-2 p-2 bg-blue-100 rounded text-xs">
                    backend/.env
                  </code>
                </div>
              )}

              {backendStatus === 'ready' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center">
                  <CheckCircle2 size={16} className="mr-2" />
                  AI features are ready to use
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between border-t">
              <button
                onClick={refreshStatus}
                className="px-4 py-2 text-gray-600 font-semibold hover:text-gray-800"
              >
                Refresh Status
              </button>
              <button
                onClick={() => setShowSettingsDialog(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-lg hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center ${notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'info' ? 'bg-blue-500 text-white' :
              'bg-green-500 text-white'
          }`}>
          {notification.type === 'error' ? <AlertCircle size={20} className="mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
          {notification.message}
        </div>
      )}
    </div>
  );
}
