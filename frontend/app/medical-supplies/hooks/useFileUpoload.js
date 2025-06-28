import { useState, useCallback } from 'react';
import { getAuthToken } from '../utils/auth'; 

const useFileUpload = (baseUrl = process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL || 'http://localhost:4001') => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Reset state
  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFiles([]);
  }, []);

  // Upload single file
  const uploadSingle = useCallback(async (file, options = {}) => {
    if (!file) {
      setError('No file provided');
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      // Add any additional form data
      if (options.metadata) {
        Object.keys(options.metadata).forEach(key => {
          formData.append(key, options.metadata[key]);
        });
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              setUploadedFiles(prev => [...prev, response]);
              setUploading(false);
              resolve(response);
            } catch (parseError) {
              setError('Invalid response from server');
              setUploading(false);
              reject(parseError);
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const errorMsg = errorResponse.message || `Upload failed with status: ${xhr.status}`;
              setError(errorMsg);
              setUploading(false);
              reject(new Error(errorMsg));
            } catch {
              const errorMsg = `Upload failed with status: ${xhr.status}`;
              setError(errorMsg);
              setUploading(false);
              reject(new Error(errorMsg));
            }
          }
        });

        xhr.addEventListener('error', () => {
          const errorMsg = 'Network error during upload';
          setError(errorMsg);
          setUploading(false);
          reject(new Error(errorMsg));
        });

        xhr.open('POST', `${baseUrl}/upload`);
        
        // Add authorization header
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  }, [baseUrl]);

  // Upload multiple files
  const uploadMultiple = useCallback(async (files, options = {}) => {
    if (!files || files.length === 0) {
      setError('No files provided');
      return null;
    }

    // Convert FileList to Array if needed
    const fileArray = Array.from(files);
    
    if (fileArray.length > 10) {
      setError('Maximum 10 files allowed');
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const token = await getAuthToken();
      const formData = new FormData();
      
      fileArray.forEach(file => {
        formData.append('files', file);
      });

      // Add any additional form data
      if (options.metadata) {
        Object.keys(options.metadata).forEach(key => {
          formData.append(key, options.metadata[key]);
        });
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              setUploadedFiles(prev => [...prev, ...response.files]);
              setUploading(false);
              resolve(response);
            } catch (parseError) {
              setError('Invalid response from server');
              setUploading(false);
              reject(parseError);
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const errorMsg = errorResponse.message || `Upload failed with status: ${xhr.status}`;
              setError(errorMsg);
              setUploading(false);
              reject(new Error(errorMsg));
            } catch {
              const errorMsg = `Upload failed with status: ${xhr.status}`;
              setError(errorMsg);
              setUploading(false);
              reject(new Error(errorMsg));
            }
          }
        });

        xhr.addEventListener('error', () => {
          const errorMsg = 'Network error during upload';
          setError(errorMsg);
          setUploading(false);
          reject(new Error(errorMsg));
        });

        xhr.open('POST', `${baseUrl}/uploads`);
        
        // Add authorization header
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  }, [baseUrl]);
  

  // Utility function to validate file types
  const validateFileType = useCallback((file, allowedTypes = []) => {
    if (allowedTypes.length === 0) return true;
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.startsWith(type);
    });
  }, []);

  // Utility function to validate file size
  const validateFileSize = useCallback((file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }, []);

  // Delete file
  const deleteFile = useCallback(async (filename) => {
    setUploading(true);
    if (!filename) {
      setError('No filename provided');
      return null;
    }

    setError(null);

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${baseUrl}/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE', // Changed from POST to DELETE to match server
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Delete failed');
        throw new Error(result.message || 'Delete failed');
      }

      // Remove file from uploadedFiles state
      setUploadedFiles(prev => 
        prev.filter(file => {
          // Handle both fileName and fileUrl properties
          const fileNameFromData = file.fileName || file.fileUrl?.split('/').pop();
          return fileNameFromData !== filename;
        })
      );
      setUploading(false);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [baseUrl]);

  // Get file info
  const getFileInfo = useCallback(async (filename) => {
    if (!filename) {
      setError('No filename provided');
      return null;
    }

    setError(null);

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${baseUrl}/file/${encodeURIComponent(filename)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to get file info');
        throw new Error(result.message || 'Failed to get file info');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [baseUrl]);

  // Upload with validation
  const uploadWithValidation = useCallback(async (files, options = {}) => {
    const {
      allowedTypes = [],
      maxSizeMB = 10,
      multiple = false
    } = options;

    const fileArray = multiple ? Array.from(files) : [files];
    
    // Validate each file
    for (const file of fileArray) {
      if (!validateFileType(file, allowedTypes)) {
        setError(`File type not allowed: ${file.name}`);
        return null;
      }
      
      if (!validateFileSize(file, maxSizeMB)) {
        setError(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
        return null;
      }
    }

    // Upload based on single or multiple
    if (multiple) {
      return uploadMultiple(files, options);
    } else {
      return uploadSingle(files, options);
    }
  }, [uploadSingle, uploadMultiple, validateFileType, validateFileSize]);

  return {
    // State
    uploading,
    progress,
    error,
    uploadedFiles,
    
    // Actions
    uploadSingle,
    uploadMultiple,
    uploadWithValidation,
    deleteFile,
    getFileInfo,
    reset,
    
    // Utilities
    validateFileType,
    validateFileSize
  };
};

export default useFileUpload;