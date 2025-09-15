'use client';

import React, { useState, useEffect } from 'react';
import { ragApi, RAGStatusResponse, RAGDocument, RAGDocumentListResponse } from '@/lib/ragApi';

interface RAGStatusProps {
  className?: string;
}

export default function RAGStatus({ className = '' }: RAGStatusProps) {
  const [status, setStatus] = useState<RAGStatusResponse | null>(null);
  const [documents, setDocuments] = useState<RAGDocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStatus = async () => {
    try {
      const statusData = await ragApi.getStatus();
      setStatus(statusData);
    } catch (err) {
      console.error('Error fetching RAG status:', err);
      setError('Failed to fetch RAG status');
    }
  };

  const fetchDocuments = async (page: number = 1, statusFilter?: string) => {
    try {
      setLoading(true);
      const documentsData = await ragApi.getDocuments(page, 10, statusFilter);
      setDocuments(documentsData);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching RAG documents:', err);
      setError('Failed to fetch RAG documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStatus(),
        fetchDocuments(1, selectedStatus || undefined)
      ]);
      setLoading(false);
    };

    loadData();
  }, [selectedStatus]);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchDocuments(page, selectedStatus || undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !status) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Documentation Status</h2>
        <p className="text-gray-600">Monitor document processing and embedding status</p>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Documents</div>
            <div className="text-2xl font-bold text-gray-900">{status.total_documents}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Chunks</div>
            <div className="text-2xl font-bold text-gray-900">{status.total_chunks.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Tokens</div>
            <div className="text-2xl font-bold text-gray-900">{status.total_tokens.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Success Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {status.total_documents > 0 
                ? Math.round((status.completed_documents / status.total_documents) * 100)
                : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {status && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleStatusFilter('')}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedStatus === '' ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{status.total_documents}</div>
              <div className="text-sm text-gray-600">All Documents</div>
            </button>
            <button
              onClick={() => handleStatusFilter('completed')}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedStatus === 'completed' ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold text-green-600">{status.completed_documents}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </button>
            <button
              onClick={() => handleStatusFilter('processing')}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedStatus === 'processing' ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold text-blue-600">{status.processing_documents}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </button>
            <button
              onClick={() => handleStatusFilter('failed')}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedStatus === 'failed' ? 'bg-red-50 border-red-300' : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold text-red-600">{status.failed_documents}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Documentation {selectedStatus && `(${selectedStatus})`}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : documents && documents.documents.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {documents.documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          Document ID: {doc.program_document_id}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>{doc.total_chunks} chunks</span>
                        <span>{doc.total_tokens.toLocaleString()} tokens</span>
                        <span>Model: {doc.embedding_model}</span>
                      </div>
                      {doc.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {doc.error_message}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        Created: {formatDate(doc.created_at)}
                      </div>
                      {doc.processing_completed_at && (
                        <div className="text-sm text-gray-500">
                          Completed: {formatDate(doc.processing_completed_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {documents.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * documents.per_page) + 1} to {Math.min(currentPage * documents.per_page, documents.total)} of {documents.total} documents
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {documents.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === documents.pages}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No documents found {selectedStatus && `with status "${selectedStatus}"`}.
          </div>
        )}
      </div>
    </div>
  );
}
