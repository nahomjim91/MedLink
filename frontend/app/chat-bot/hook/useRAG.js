import { useState, } from 'react';

// Custom hook for RAG operations
export const useRAG = (baseUrl = 'http://localhost:4000') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Query documents
  const query = async (question, options = {}) => {
    const { topK = 5, streaming = false } = options;
    setIsLoading(true);
    setError(null);

    try {
      if (streaming) {
        const response = await fetch(`${baseUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, topK, streaming: true }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.body;
      } else {
        const response = await fetch(`${baseUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, topK, streaming: false }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async (file, pageNumber = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('pageNumber', pageNumber.toString());

      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get system stats
  const getStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setStats(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check health
  const checkHealth = async () => {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    query,
    uploadDocument,
    getStats,
    checkHealth,
    isLoading,
    error,
    stats,
    clearError: () => setError(null)
  };
};

// Stream reader helper
export const useStreamReader = () => {
  const [streamData, setStreamData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);

  const readStream = async (stream) => {
    setIsStreaming(true);
    setStreamComplete(false);
    setStreamData('');

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamData(prev => prev + data.content);
              } else if (data.finished) {
                setStreamComplete(true);
                setIsStreaming(false);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error);
      setIsStreaming(false);
    }
  };

  return { streamData, isStreaming, streamComplete, readStream };
};