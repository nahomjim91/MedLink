import { useState, useEffect, useCallback } from 'react';
import { auth } from '../api/firebase/config';

const useRAG = (baseURL = 'http://localhost:4002/api/rag') => {
  // State management
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  // Get Firebase auth token
 useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      user
        .getIdToken()
        .then((token) => {
        //   console.log('Token acquired:', token); // ✅
          setToken(token);
        })
        .catch((error) => {
          console.error("Error getting token:", error);
          setToken(null);
        });
    } else {
      console.log("No user logged in"); // ✅
      setToken(null);
    }
  });
  return () => unsubscribe();
}, []);



  // Helper function to make authenticated requests
  const makeRequest = useCallback(async (endpoint, options = {}) => {
    if (!token) {
      throw new Error('Authentication token not available');
    }

    const url = `${baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }, [token, baseURL]);

  // Query the RAG system
  const query = useCallback(async (question, language = 'english', gender = 'male' , userType = 'patient') => {
    if (!question.trim()) {
      throw new Error('Question cannot be empty');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/query', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim(),
          language: language.toLowerCase(),
          gender: gender,
          userType: userType
        }),
      });

      const queryResult = {
        id: Date.now(),
        question,
        language,
        result: response.data,
        timestamp: new Date(),
      };

      setLastQuery(queryResult);
      setQueryHistory(prev => [queryResult, ...prev.slice(0, 49)]); // Keep last 50 queries

      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to query RAG system';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);


  // Get service status
  const getStatus = useCallback(async () => {
    setError(null);

    try {
      const response = await makeRequest('/status');
      setServiceStatus(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get service status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [makeRequest]);

  // Initialize the service
  const initializeService = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      setServiceStatus(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to initialize service';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  useEffect(() => {
  initializeService();
}, [token , initializeService]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear query history
  const clearHistory = useCallback(() => {
    setQueryHistory([]);
    setLastQuery(null);
  }, []);


  // Convenience methods for different query types
  const queryEnglish = useCallback((question,  gender, userType) => {
    console.log("gender" , gender)
    return query(question, 'english', gender , userType);
  }, [query]);

  const queryAmharic = useCallback((question , gender) => {
    return query(question, 'amharic' , gender);
  }, [query]);



  return {
    // State
    loading,
    error,
    serviceStatus,
    lastQuery,
    queryHistory,
    isAuthenticated: !!token,

    // Core methods
    query,
    queryEnglish,
    queryAmharic,

    

    // Service management
    getStatus,
    initializeService,

    // Utility methods
    clearError,
    clearHistory,

    // Computed properties
    isServiceReady: serviceStatus?.initialized === true,
  };
};

export default useRAG;