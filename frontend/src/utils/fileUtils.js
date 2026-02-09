// File Utilities for PRD Generator

/**
 * Convert a file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<{name: string, size: number, type: string, base64: string, uploadedAt: string}>}
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        base64: reader.result,
        uploadedAt: new Date().toISOString()
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Convert multiple files to base64
 * @param {FileList|File[]} files - Files to convert
 * @returns {Promise<Array>}
 */
export const filesToBase64 = async (files) => {
  const fileArray = Array.from(files);
  const promises = fileArray.map(file => fileToBase64(file));
  return Promise.all(promises);
};

/**
 * Check if file is an image
 * @param {string} type - MIME type
 * @returns {boolean}
 */
export const isImage = (type) => {
  return type.startsWith('image/');
};

/**
 * Check if file is a document
 * @param {string} type - MIME type
 * @returns {boolean}
 */
export const isDocument = (type) => {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  return docTypes.includes(type);
};

/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

/**
 * Get icon/emoji for file type
 * @param {string} type - MIME type
 * @returns {string}
 */
export const getFileIcon = (type) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('word')) return '📘';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type === 'application/zip' || type.includes('compressed')) return '📦';
  return '📄';
};

/**
 * Validate file size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {{valid: boolean, message: string}}
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File "${file.name}" exceeds ${maxSizeMB}MB limit`
    };
  }
  return { valid: true, message: '' };
};

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types or extensions
 * @returns {{valid: boolean, message: string}}
 */
export const validateFileType = (file, allowedTypes) => {
  const ext = getFileExtension(file.name);
  const isAllowed = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return ext === type.slice(1);
    }
    return file.type === type || file.type.startsWith(type.replace('/*', ''));
  });

  if (!isAllowed) {
    return {
      valid: false,
      message: `File type "${file.type || ext}" is not allowed`
    };
  }
  return { valid: true, message: '' };
};

/**
 * Create a download from base64 data
 * @param {string} base64 - Base64 string (with or without data URL prefix)
 * @param {string} filename - Download filename
 */
export const downloadBase64 = (base64, filename) => {
  const link = document.createElement('a');
  link.href = base64.startsWith('data:') ? base64 : `data:application/octet-stream;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Extract text content from uploaded documents (basic)
 * This is a placeholder - full implementation would require server-side processing
 * @param {object} file - File object with base64 data
 * @returns {Promise<string>}
 */
export const extractTextFromFile = async (file) => {
  // For text files, we can extract directly
  if (file.type === 'text/plain' || file.type === 'text/csv') {
    const base64Content = file.base64.split(',')[1];
    return atob(base64Content);
  }

  // For other files, return a placeholder message
  // In production, this would use a PDF parser, DOCX parser, etc.
  return `[Content from ${file.name} - requires server-side processing for full extraction]`;
};
