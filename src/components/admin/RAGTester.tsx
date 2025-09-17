'use client';

import React, { useState } from 'react';
import { ragApi, RAGQueryRequest, RAGQueryResponse } from '@/lib/ragApi';

interface RAGTesterProps {
  className?: string;
}

export default function RAGTester({ className = '' }: RAGTesterProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxChunks, setMaxChunks] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const request: RAGQueryRequest = {
        query: query.trim(),
        max_chunks: maxChunks,
        similarity_threshold: similarityThreshold
      };

      const response = await ragApi.queryDocuments(request);
      setResults(response);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.detail || 'Failed to search documents');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const formatTime = (ms: number) => `${ms.toFixed(2)}ms`;

  const getSearchMethodBadge = (method: string) => {
    const colors = {
      hybrid: 'bg-purple-100 text-purple-800',
      dense: 'bg-blue-100 text-blue-800',
      sparse: 'bg-green-100 text-green-800'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">RAG Search Tester</h2>
        <p className="text-gray-600">Test the new hybrid search with university documents</p>
      </div>

      {/* Search Configuration */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about admission requirements, fees, courses, etc..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxChunks" className="block text-sm font-medium text-gray-700 mb-1">
              Max Results
            </label>
            <input
              type="number"
              id="maxChunks"
              value={maxChunks}
              onChange={(e) => setMaxChunks(parseInt(e.target.value) || 5)}
              min={1}
              max={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="similarity" className="block text-sm font-medium text-gray-700 mb-1">
              Similarity Threshold
            </label>
            <input
              type="number"
              id="similarity"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value) || 0.7)}
              min={0}
              max={1}
              step={0.1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search Documents'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Search Performance</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSearchMethodBadge(results.search_method)}`}>
                {results.search_method.toUpperCase()} SEARCH
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Results Found</div>
                <div className="font-semibold text-gray-900">{results.total_retrieved}</div>
              </div>
              <div>
                <div className="text-gray-600">Embedding Time</div>
                <div className="font-semibold text-gray-900">{formatTime(results.embedding_time_ms)}</div>
              </div>
              <div>
                <div className="text-gray-600">Retrieval Time</div>
                <div className="font-semibold text-gray-900">{formatTime(results.retrieval_time_ms)}</div>
              </div>
              <div>
                <div className="text-gray-600">Total Time</div>
                <div className="font-semibold text-gray-900">{formatTime(results.total_time_ms)}</div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({results.chunks.length})
            </h3>
            
            {results.chunks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No results found. Try adjusting your query or similarity threshold.
              </div>
            ) : (
              <div className="space-y-4">
                {results.chunks.map((chunk, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Similarity: {(chunk.similarity_score * 100).toFixed(1)}%
                        </span>
                        {chunk.university_name && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {chunk.university_name}
                          </span>
                        )}
                        {chunk.program_name && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {chunk.program_name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Page {chunk.page_number || 'N/A'}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Section:</span> {chunk.section_title || 'General'} |{' '}
                        <span className="font-medium">Type:</span> {chunk.chunk_type} |{' '}
                        <span className="font-medium">Tokens:</span> {chunk.token_count}
                        {chunk.document_type && (
                          <>
                            {' | '}
                            <span className="font-medium">Document:</span> {chunk.document_type}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-900 leading-relaxed">
                      {chunk.content}
                    </div>

                    {chunk.program_level && (
                      <div className="mt-3 text-sm text-gray-500">
                        <span className="font-medium">Program Level:</span> {chunk.program_level}
                        {chunk.field_of_study && (
                          <>
                            {' | '}
                            <span className="font-medium">Field:</span> {chunk.field_of_study}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
