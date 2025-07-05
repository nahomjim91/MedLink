'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, FileText, MessageSquare, AlertCircle, CheckCircle, Loader2, BarChart3, X } from 'lucide-react';
import { useRAG, useStreamReader } from '../hook/useRAG';

// Main RAG Testing Component
const RAGTestingInterface = () => {
  const { query, uploadDocument, getStats, checkHealth, isLoading, error, stats, clearError } = useRAG();
  const { streamData, isStreaming, streamComplete, readStream } = useStreamReader();
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [context, setContext] = useState([]);
  const [topK, setTopK] = useState(5);
  const [useStreaming, setUseStreaming] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('query');
  
  const fileInputRef = useRef(null);

  // Load initial data
  useEffect(() => {
    Promise.all([getStats(), checkHealth()])
      .then(([statsData, healthData]) => {
        setHealth(healthData);
      })
      .catch(console.error);
  }, []);

  // Handle query submission
  const handleQuery = async () => {
    if (!question.trim()) return;

    clearError();
    setAnswer('');
    setSources([]);
    setContext([]);

    try {
      if (useStreaming) {
        const stream = await query(question, { topK, streaming: true });
        await readStream(stream);
      } else {
        const result = await query(question, { topK, streaming: false });
        setAnswer(result.answer);
        setSources(result.sources || []);
        setContext(result.context || []);
      }
    } catch (err) {
      console.error('Query failed:', err);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    clearError();
    setUploadStatus('uploading');

    try {
      const result = await uploadDocument(file);
      setUploadStatus('success');
      console.log('Upload successful:', result);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Auto-clear success status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus('error');
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-secondary flex items-center gap-3">
            <MessageSquare className="text-blue-600" />
            RAG System Testing Interface
          </h1>
          <p className="text-gray-600 mt-2">Test document upload and query functionality</p>
          
          {/* Health Status */}
          {health && (
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">System Status: {health.status}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'query', label: 'Query Documents', icon: Search },
              { id: 'upload', label: 'Upload Documents', icon: Upload },
              { id: 'stats', label: 'System Stats', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about your documents..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Top K Results
                    </label>
                    <input
                      type="number"
                      value={topK}
                      onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                      min="1"
                      max="20"
                      className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="streaming"
                      checked={useStreaming}
                      onChange={(e) => setUseStreaming(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="streaming" className="text-sm text-gray-700">
                      Use Streaming Response
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleQuery}
                  disabled={isLoading || isStreaming || !question.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isLoading || isStreaming) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isStreaming ? 'Streaming...' : 'Query Documents'}
                </button>
              </div>

              {/* Results */}
              {(answer || streamData) && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-secondary mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Answer
                      {isStreaming && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {useStreaming ? streamData : answer}
                      </p>
                    </div>
                  </div>

                  {sources.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Sources ({sources.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {context.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Context Chunks ({context.length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {context.map((chunk, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-green-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-green-600 font-medium">
                                {chunk.source}
                              </span>
                              <span className="text-xs text-gray-500">
                                Score: {chunk.score?.toFixed(4)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{chunk.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary mb-2">
                  Upload Documents
                </h3>
                <p className="text-gray-600 mb-4">
                  Select .txt or .md files to add to your knowledge base
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Choose File
                </button>
              </div>

              {/* Upload Status */}
              {uploadStatus && (
                <div className={`p-4 rounded-lg ${
                  uploadStatus === 'success' 
                    ? 'bg-green-50 border border-green-200'
                    : uploadStatus === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {uploadStatus === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                    {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    
                    <span className={`font-medium ${
                      uploadStatus === 'success' 
                        ? 'text-green-800'
                        : uploadStatus === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {uploadStatus === 'uploading' && 'Uploading document...'}
                      {uploadStatus === 'success' && 'Document uploaded successfully!'}
                      {uploadStatus === 'error' && 'Upload failed'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-secondary mb-3">System Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collection:</span>
                        <span className="font-medium">{stats.collection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vector Dimension:</span>
                        <span className="font-medium">{stats.vector_dimension}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Milvus Address:</span>
                        <span className="font-medium">{stats.milvus_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ollama Host:</span>
                        <span className="font-medium">{stats.ollama_host}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-secondary mb-3">Model Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Embedding Model:</span>
                        <span className="font-medium">{stats.embedding_model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">LLM Model:</span>
                        <span className="font-medium">{stats.llm_model}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Loading system statistics...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RAGTestingInterface;