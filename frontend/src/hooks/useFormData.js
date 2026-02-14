// Custom hook for form data management

import { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_FORM_DATA } from '../constants';

/**
 * Custom hook for managing PRD form data
 * @returns {object} Form data state and handlers
 */
export const useFormData = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const formDataRef = useRef(formData);

  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
  }, []);

  // Handle array item update (e.g., competitors, milestones)
  const handleArrayItemUpdate = useCallback((field, index, itemField, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [itemField]: value };
      return { ...prev, [field]: newArray };
    });
  }, []);

  // Add item to array
  const addToArray = useCallback((field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], item]
    }));
  }, []);

  // Remove item from array
  const removeFromArray = useCallback((field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  }, []);

  // Remove item from array by value
  const removeFromArrayByValue = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  }, []);

  // Load previous tech stack (no-op without persistence)
  const loadPreviousTechStack = useCallback(() => {
    return false;
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleNestedChange,
    handleArrayItemUpdate,
    addToArray,
    removeFromArray,
    removeFromArrayByValue,
    loadPreviousTechStack,
    resetForm
  };
};

export default useFormData;
