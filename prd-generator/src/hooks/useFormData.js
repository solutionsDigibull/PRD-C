// Custom hook for form data management (no persistence - resets on refresh)

import { useState, useCallback } from 'react';
import { INITIAL_FORM_DATA } from '../constants';

/**
 * Custom hook for managing PRD form data
 * @returns {object} Form data state and handlers
 */
export const useFormData = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);

  // No-op save function (kept for API compatibility)
  const saveFormData = useCallback(() => {
    setAutoSaveStatus('saved');
    setLastSaved(new Date());
    return true;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAutoSaveStatus('unsaved');
  }, []);

  // Handle nested object change (e.g., appStructure, selectedTechStack)
  const handleNestedChange = useCallback((parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
    setAutoSaveStatus('unsaved');
  }, []);

  // Handle array item update (e.g., competitors, milestones)
  const handleArrayItemUpdate = useCallback((field, index, itemField, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [itemField]: value };
      return { ...prev, [field]: newArray };
    });
    setAutoSaveStatus('unsaved');
  }, []);

  // Add item to array
  const addToArray = useCallback((field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], item]
    }));
    setAutoSaveStatus('unsaved');
  }, []);

  // Remove item from array
  const removeFromArray = useCallback((field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
    setAutoSaveStatus('unsaved');
  }, []);

  // Remove item from array by value
  const removeFromArrayByValue = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
    setAutoSaveStatus('unsaved');
  }, []);

  // Load previous tech stack (no-op without persistence)
  const loadPreviousTechStack = useCallback(() => {
    return false;
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setAutoSaveStatus('saved');
  }, []);

  // Force save immediately (no-op without persistence)
  const forceSave = useCallback(() => {
    return saveFormData();
  }, [saveFormData]);

  return {
    formData,
    setFormData,
    autoSaveStatus,
    lastSaved,
    handleInputChange,
    handleNestedChange,
    handleArrayItemUpdate,
    addToArray,
    removeFromArray,
    removeFromArrayByValue,
    loadPreviousTechStack,
    resetForm,
    forceSave,
    saveFormData
  };
};

export default useFormData;
