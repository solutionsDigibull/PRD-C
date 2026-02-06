import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Rocket, Palette, FileText, Wand2, Upload, Check, X, Search, Link, FolderArchive, Users, Send, Info, Download, Camera, Eye, CheckCircle2, FileCheck, Settings, AlertCircle, Loader2, RefreshCw, FolderSearch, Play } from 'lucide-react';

// Import hooks and utilities
import { useFormData, useAI } from '../hooks';
import { calculateContrast } from '../utils/colorUtils';
import { filesToBase64, isImage, formatFileSize, getFileIcon } from '../utils/fileUtils';
import { exportPRD } from '../utils/exportUtils';
import { sendPRDViaEmail, isValidEmail } from '../utils/emailUtils';

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
  DOCUMENT_CHECKLIST,
  HELP_TEXTS,
  ISTVON_SECTIONS,
  PRD_PROMPT_TEMPLATE,
  DEFAULT_PRD_PROMPT
} from '../constants';

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
    handleInputChange,
    handleNestedChange,
    handleArrayItemUpdate,
    addToArray,
    removeFromArray,
    removeFromArrayByValue,
    loadPreviousTechStack,
    forceSave
  } = useFormData();

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
    suggestChartGuidelines,
    suggestImageGuidelines,
    generatePRD: generatePRDFromAI,
    generateProposalCoverLetter,
    enhancePrdPrompt,
    analyzeUploadedFiles,
    analyzeDriveLink,
    coworkFetch,
    clearError,
    refreshStatus
  } = useAI();

  // UI State
  const [currentStep, setCurrentStep] = useState(0);
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

  // Refs for click outside handling
  const demographyRef = useRef(null);
  const geographyRef = useRef(null);

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

  // Check PRD review completion
  useEffect(() => {
    const allChecked = PRD_REVIEW_CHECKLIST.every(item => prdReviewChecked[item.id]);
    setPrdReviewComplete(allChecked);
  }, [prdReviewChecked]);

  // Auto-check PRD review items based on form data
  useEffect(() => {
    const autoChecked = {};
    PRD_REVIEW_CHECKLIST.forEach(item => {
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

    try {
      const convertedFiles = await filesToBase64(files);
      const field = type === 'photos' ? 'uploadedPhotos' : 'uploadedFiles';
      handleInputChange(field, [...formData[field], ...convertedFiles]);
      showNotification(`${convertedFiles.length} file(s) uploaded successfully`);

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

  // Remove file handler
  const removeFile = (field, index) => {
    removeFromArray(field, index);
  };

  // Template apply handler
  const handleTemplateApply = () => {
    const filledTemplate = APP_IDEA_TEMPLATE
      .replace('[App Name]', formData.appName || 'Your App')
      .replace('[platform type]', formData.platform || 'application')
      .replace('[target audience]', formData.targetAudienceDemography[0] || 'users')
      .replace('[primary function]', 'solve specific problems');

    handleInputChange('appIdea', filledTemplate.substring(0, 1000));
    setShowTemplateDialog(false);
    showNotification('Template applied successfully');
  };

  // AI Enhancement handler
  const aiEnhanceField = async (field) => {
    if (!aiConfigured) {
      setShowSettingsDialog(true);
      return;
    }

    let result;
    switch (field) {
      case 'problemStatement':
        result = await enhanceProblemStatement(formData.problemStatement, formData.appName, formData.appIdea);
        break;
      case 'goal':
        result = await enhanceGoal(formData.goal, formData.appName, formData.problemStatement);
        break;
      case 'outOfScope':
        result = await suggestOutOfScope(formData.appName, formData.appIdea, formData.platform);
        break;
      case 'chartGuidelines':
        result = await suggestChartGuidelines(formData.primaryColor, formData.secondaryColor);
        break;
      case 'imageGuidelines':
        result = await suggestImageGuidelines(formData.imageBorderRadius, formData.imageAspectRatio);
        break;
      default:
        return;
    }

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

    const result = await recommendAPIs(formData.appName, formData.appIdea, formData.platform, formData.selectedTechStack);

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

    const result = await discoverCompetitors(formData.appName, formData.appIdea, formData.targetAudienceDemography);

    if (result.success && result.data) {
      handleInputChange('competitors', result.data);
      showNotification('Competitors discovered');
    } else {
      showNotification(result.error || 'Failed to discover competitors', 'error');
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
    if (pendingFileFields) {
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
    prdPromptTemplate: 'PRD Prompt'
  };

  // Update competitor
  const updateCompetitor = (index, field, value) => {
    handleArrayItemUpdate('competitors', index, field, value);
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

    const result = await generatePRDFromAI(formData);

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
    const result = await generateProposalCoverLetter(formData, template);

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

  // Navigation
  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      forceSave();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
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
      {/* App Name + App Idea */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center text-base font-bold text-gray-800 mb-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1a</span>
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
          <label className="flex items-center text-base font-bold text-gray-800 mb-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1b</span>
            App Idea
            <HelpTooltip text={HELP_TEXTS.appIdea} />
          </label>
          <input
            type="text"
            value={formData.appIdea}
            onChange={(e) => handleInputChange('appIdea', e.target.value)}
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all ${formData.appIdea.length > 100 ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
            placeholder="Brief description..."
          />
          <div className="flex justify-end mt-1">
            <span className={`text-sm font-medium ${formData.appIdea.length > 100 ? 'text-red-500' : 'text-gray-500'}`}>{formData.appIdea.length}/100</span>
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
          Upload Documents
          <HelpTooltip text={HELP_TEXTS.documents} />
        </label>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowPrepChecklist(!showPrepChecklist)}
            className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-all text-sm"
          >
            📋 BuLLMake Document Checklist
          </button>
          <button
            onClick={() => setShowMappedChecklist(!showMappedChecklist)}
            className="px-4 py-2 bg-teal-100 text-teal-700 font-semibold rounded-lg hover:bg-teal-200 transition-all text-sm"
          >
            ✓ Upload Status
          </button>
        </div>

        {showPrepChecklist && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <ul className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-blue-800">
              {DOCUMENT_CHECKLIST.map(item => (
                <li key={item.id} className="flex items-center">
                  <Check size={12} className="mr-1.5 text-blue-600 flex-shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-200">
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
                            showNotification(`Cowork scanned ${result.data.scannedCount} files — ${result.data.relevantCount} field${result.data.relevantCount > 1 ? 's' : ''} found`, 'info');
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
          </div>
        )}

        {showMappedChecklist && (() => {
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

          const fileMatches = {};
          const matchedFileIds = new Set();

          DOCUMENT_CHECKLIST.forEach(item => {
            const keywords = categoryKeywords[item.id] || [];
            fileMatches[item.id] = formData.uploadedFiles.filter(f => {
              const name = f.name.toLowerCase().replace(/[_\-./\\]/g, ' ');
              return keywords.some(kw => name.includes(kw));
            });
            fileMatches[item.id].forEach(f => matchedFileIds.add(f.id));
          });

          const unmatchedFiles = formData.uploadedFiles.filter(f => !matchedFileIds.has(f.id));

          return (
            <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-5 mb-6">
              <h4 className="font-bold text-teal-900 mb-3">Upload Status</h4>
              <div className="space-y-2 text-sm">
                {DOCUMENT_CHECKLIST.map(item => {
                  const matched = fileMatches[item.id];
                  return (
                    <div key={item.id} className="p-2 bg-white rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">{item.label}</span>
                        {matched.length > 0 ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle2 size={16} className="mr-1" /> {matched.length} file{matched.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </div>
                      {matched.length > 0 && (
                        <div className="mt-1 pl-1 flex flex-wrap gap-1">
                          {matched.map(f => (
                            <span key={f.id} className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                              {getFileIcon(f.type)} {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {unmatchedFiles.length > 0 && (
                  <div className="p-2 bg-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 italic">Other uploads</span>
                      <span className="text-blue-500 text-xs">{unmatchedFiles.length} file{unmatchedFiles.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-1 pl-1 flex flex-wrap gap-1">
                      {unmatchedFiles.map(f => (
                        <span key={f.id} className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
                          {getFileIcon(f.type)} {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-8 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
            <FolderArchive size={32} className="text-gray-400 mb-2" />
            <span className="font-medium text-gray-700 text-sm">Drop files/ZIP or click to browse local folder</span>
            <small className="text-gray-400 text-xs mt-1 text-center">Files are validated internally. ZIP archives are extracted securely. Executable files are blocked.</small>
            <input type="file" onChange={(e) => handleFileUpload(e)} className="hidden" multiple />
          </label>

          <div className="flex flex-col gap-3">
            <div className="flex items-stretch gap-2 flex-1">
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

            <div className="flex items-stretch gap-2 flex-1">
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

      {/* BuLLM PRD Template Section */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-blue-900">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
            BuLLM PRD Template
            <HelpTooltip text="Create your PRD prompt using the ISTVON framework for comprehensive documentation." />
          </label>
          <button
            onClick={async () => {
              if (!formData.appName && !formData.appIdea) {
                showNotification('Please enter App Name or App Idea first', 'error');
                return;
              }
              const basePrompt = formData.prdPromptTemplate || DEFAULT_PRD_PROMPT;
              const result = await enhancePrdPrompt(basePrompt, formData.appName, formData.appIdea);
              if (result.success && result.data) {
                handleInputChange('prdPromptTemplate', result.data.substring(0, 1150));
                showNotification('PRD prompt enhanced with AI');
              } else {
                showNotification(result.error || 'Failed to enhance prompt', 'error');
              }
            }}
            disabled={aiEnhancing}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
            AI Enhance
          </button>
        </div>
        <textarea
          value={formData.prdPromptTemplate || DEFAULT_PRD_PROMPT}
          onChange={(e) => handleInputChange('prdPromptTemplate', e.target.value)}
          className={`w-full px-5 py-4 bg-white border-2 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none ${(formData.prdPromptTemplate || DEFAULT_PRD_PROMPT).length > 1150 ? 'border-red-300 text-red-600' : 'border-blue-200'}`}
          rows="5"
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-3">
            <button
              onClick={() => setShowDetailedReport(!showDetailedReport)}
              className="flex items-center px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-all border-2 border-blue-300"
            >
              <FileCheck size={16} className="mr-2" />
              {showDetailedReport ? 'Hide Scope of Work' : 'Scope of Work'}
            </button>
          </div>
          <span className={`text-sm font-medium ${(formData.prdPromptTemplate || DEFAULT_PRD_PROMPT).length > 1150 ? 'text-red-500' : 'text-blue-700'}`}>{(formData.prdPromptTemplate || DEFAULT_PRD_PROMPT).length}/1150</span>
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

      {/* Detailed Report Section */}
      {showDetailedReport && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <h4 className="font-bold text-blue-800 mb-4 flex items-center">
            <FileCheck size={20} className="mr-2" />
            Detailed Report (ISTVON v2.4)
          </h4>
          <div className="space-y-4 text-sm">
            {ISTVON_SECTIONS.map((section) => (
              <div key={section.id} className="border-b border-gray-100 pb-3">
                <h5 className="font-semibold text-gray-800 mb-2">{section.letter} - {section.title}</h5>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  {section.fields.map((field) => (
                    <div key={field.key} className="flex">
                      <span className="font-medium mr-2">{field.label}:</span>
                      <span>{formData.istvonData[field.key] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem Statement */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-gray-800">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4a</span>
            Problem Statement
            <HelpTooltip text={HELP_TEXTS.problemStatement} />
          </label>
          <button
            onClick={() => aiEnhanceField('problemStatement')}
            disabled={aiEnhancing}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
            AI Enhance
          </button>
        </div>
        <textarea
          value={formData.problemStatement}
          onChange={(e) => handleInputChange('problemStatement', e.target.value)}
          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
          rows="5"
          placeholder="Describe the problems your app will solve..."
        />
      </div>

      {/* Goal */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-gray-800">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4b</span>
            Main Goal
            <HelpTooltip text={HELP_TEXTS.goal} />
          </label>
          <button
            onClick={() => aiEnhanceField('goal')}
            disabled={aiEnhancing}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
            AI Enhance
          </button>
        </div>
        <textarea
          value={formData.goal}
          onChange={(e) => handleInputChange('goal', e.target.value)}
          className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
          rows="3"
          placeholder="Define the primary objective..."
        />
      </div>

      {/* Target Audience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div ref={demographyRef}>
          <label className="flex items-center text-base font-bold text-gray-800 mb-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5a</span>
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
          <label className="flex items-center text-base font-bold text-gray-800 mb-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">5b</span>
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

      {/* Out of Scope */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-base font-bold text-gray-800">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
            Out of Scope
            <HelpTooltip text={HELP_TEXTS.outOfScope} />
          </label>
          <button
            onClick={() => aiEnhanceField('outOfScope')}
            disabled={aiEnhancing}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
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

      {/* Timeline & Project Details */}
      <div>
        <label className="flex items-center text-base font-bold text-gray-800 mb-4">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">7</span>
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
              onClick={() => handleInputChange('platform', option.name)}
              className={`px-3 py-2 rounded-lg border-2 font-bold text-xs transition-all ${formData.platform === option.name
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
            >
              <div className="text-lg leading-none mb-0.5">{option.emoji}</div>
              <div className={`leading-tight ${formData.platform === option.name ? 'text-blue-700' : 'text-gray-700'}`}>
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
              disabled={aiEnhancing}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {aiEnhancing ? <Loader2 size={14} className="inline mr-2 animate-spin" /> : <Wand2 size={14} className="inline mr-2" />}
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
            disabled={aiEnhancing}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
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

  // Step 2: Visual Style Guide (continued in next part due to length)
  const renderStep2 = () => (
    <div className="space-y-8 bg-blue-50 p-6 rounded-2xl">
      {/* Removed Visual Style Guide intro box per image reference */}
      <div className="border-b-2 border-blue-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold text-blue-900">Visual Style Guide</h3>
        <p className="text-blue-700 text-sm mt-1">Define your application's complete visual identity</p>
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
            <span className="font-medium text-gray-700 text-sm mb-1">Photographs</span>
            <span className="text-xs text-gray-500">Brand images</span>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" multiple />
          </label>
        </div>
        {formData.uploadedPhotos.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">{formData.uploadedPhotos.length} photo(s) uploaded</div>
            <div className="flex gap-2 flex-wrap">
              {formData.uploadedPhotos.map((photo, idx) => (
                <div key={photo.id} className="relative group">
                  <img src={photo.base64} alt={photo.name} className="w-16 h-16 object-cover rounded" />
                  <button
                    onClick={() => removeFile('uploadedPhotos', idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
            <select
              value={formData.primaryFont}
              onChange={(e) => handleInputChange('primaryFont', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-lg outline-none"
            >
              {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
            <label className="block text-sm font-bold text-blue-900 mb-3">Heading Font</label>
            <select
              value={formData.headingsFont}
              onChange={(e) => handleInputChange('headingsFont', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-lg outline-none"
            >
              {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
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
                  disabled={aiEnhancing}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {aiEnhancing ? 'Processing...' : 'AI Enhance'}
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
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
          Image & Photography Guidelines
          <HelpTooltip text={HELP_TEXTS.images} />
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
                disabled={aiEnhancing}
                className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {aiEnhancing ? 'Processing...' : 'AI Enhance'}
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
              {['from-blue-200 to-cyan-300', 'from-blue-200 to-cyan-300', 'from-purple-200 to-pink-300', 'from-green-200 to-teal-300'].map((gradient, idx) => (
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

  // Step 3: Generate PRD
  const renderStep3 = () => (
    <div className="space-y-6 bg-blue-50 p-6 rounded-2xl">
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
          <HelpTooltip text={HELP_TEXTS.prdReview} />
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {PRD_REVIEW_CHECKLIST.map(item => (
            <label key={item.id} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-500 rounded mr-2 flex-shrink-0"
                checked={prdReviewChecked[item.id] || false}
                onChange={(e) => setPrdReviewChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{item.label}</div>
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
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={generatePRD}
            disabled={aiEnhancing}
            className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {aiEnhancing ? (
              <Loader2 size={32} className="mx-auto mb-3 text-blue-600 animate-spin" />
            ) : (
              <FileText size={32} className="mx-auto mb-3 text-blue-600" />
            )}
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
            onClick={() => handleExportPRD('pdf')}
            disabled={!formData.generatedPRD || isExporting}
            className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={32} className="mx-auto mb-3 text-blue-600 animate-spin" />
            ) : (
              <Download size={32} className="mx-auto mb-3 text-blue-600" />
            )}
            <div className="font-bold text-blue-900 mb-1">3. Export</div>
            <div className="text-xs text-blue-700">PDF, DOC, JSON</div>
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
            BuLLM Application Builder
          </h1>
          <p className="text-xl text-gray-600 font-medium">PRD Generator</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center items-center space-x-3 mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`transition-all duration-300 rounded-full ${index === currentStep
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
                  {currentStep + 1}/{STEPS.length}
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
                className={`group flex items-center px-6 py-3 rounded-xl font-bold transition-all ${currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md border-2 border-gray-200'
                  }`}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep < STEPS.length - 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))}
                    className="px-6 py-3 bg-white text-gray-600 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
                  >
                    Skip
                  </button>
                )}

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
                        disabled={aiEnhancing}
                        className={`flex-1 p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                          activeProposalTab === key && generatedProposalContent[key]
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        {aiEnhancing && activeProposalTab === key ? (
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
              {Object.entries(pendingFileFields).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700 text-sm">{fieldLabels[key] || key}</span>
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
