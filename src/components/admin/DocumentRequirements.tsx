'use client';

import { useState, useEffect } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import adminApi from '@/lib/adminApi';

interface DocumentType {
  id: number;
  name: string;
  description?: string;
  is_common: boolean;
  created_at: string;
}

interface DocumentRequirementsProps {
  programId: number;
}

export default function DocumentRequirements({ programId }: DocumentRequirementsProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');

  useEffect(() => {
    loadData();
  }, [programId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesResponse, requirementsResponse] = await Promise.all([
        adminApi.get('/admin/api/document-types/'),
        adminApi.get(`/admin/api/document-types/program/${programId}`)
      ]);
      
      setDocumentTypes(typesResponse.data.document_types);
      setRequiredDocuments(requirementsResponse.data.required_documents || []);
    } catch (error: any) {
      console.error('Failed to load document requirements:', error);
      setError('Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRequirement = async (documentType: DocumentType) => {
    const isCurrentlyRequired = requiredDocuments.some(doc => doc.id === documentType.id);
    
    let newRequiredIds: number[];
    if (isCurrentlyRequired) {
      newRequiredIds = requiredDocuments
        .filter(doc => doc.id !== documentType.id)
        .map(doc => doc.id);
    } else {
      newRequiredIds = [...requiredDocuments.map(doc => doc.id), documentType.id];
    }
    
    try {
      setSaving(true);
      await adminApi.post(`/admin/api/document-types/program/${programId}/requirements`, {
        program_id: programId,
        document_type_ids: newRequiredIds
      });
      
      // Update local state
      if (isCurrentlyRequired) {
        setRequiredDocuments(prev => prev.filter(doc => doc.id !== documentType.id));
      } else {
        setRequiredDocuments(prev => [...prev, documentType]);
      }
    } catch (error: any) {
      console.error('Failed to update requirements:', error);
      alert('Failed to update requirements');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDocumentType = async () => {
    if (!newDocumentName.trim()) return;
    
    try {
      setSaving(true);
      const response = await adminApi.post('/admin/api/document-types/', {
        name: newDocumentName,
        description: newDocumentDescription,
        is_common: true
      });
      
      setDocumentTypes(prev => [...prev, response.data]);
      setNewDocumentName('');
      setNewDocumentDescription('');
      setShowNewDocumentForm(false);
    } catch (error: any) {
      console.error('Failed to create document type:', error);
      alert(error.response?.data?.detail || 'Failed to create document type');
    } finally {
      setSaving(false);
    }
  };

  const seedDocumentTypes = async () => {
    try {
      setSaving(true);
      await adminApi.post('/admin/api/document-types/seed');
      await loadData();
    } catch (error: any) {
      console.error('Failed to seed document types:', error);
      alert('Failed to seed document types');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading document requirements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
          <p className="text-sm text-gray-500">Select which documents students need to submit for this program</p>
        </div>
        <div className="flex space-x-2">
          {documentTypes.length === 0 && (
            <button
              onClick={seedDocumentTypes}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Seed Default Types
            </button>
          )}
          <button
            onClick={() => setShowNewDocumentForm(!showNewDocumentForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Document Type
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* New Document Form */}
      {showNewDocumentForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Document Type</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Statement of Purpose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={newDocumentDescription}
                onChange={(e) => setNewDocumentDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
                placeholder="Brief description of what this document should contain..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateDocumentType}
                disabled={saving || !newDocumentName.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowNewDocumentForm(false);
                  setNewDocumentName('');
                  setNewDocumentDescription('');
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Types List */}
      {documentTypes.length > 0 ? (
        <div className="space-y-3">
          {/* Common Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Common Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentTypes.filter(doc => doc.is_common).map((documentType) => {
                const isRequired = requiredDocuments.some(doc => doc.id === documentType.id);
                
                return (
                  <div
                    key={documentType.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isRequired 
                        ? 'border-indigo-200 bg-indigo-50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggleRequirement(documentType)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isRequired 
                          ? 'bg-indigo-600 border-indigo-600' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isRequired && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900">{documentType.name}</h5>
                      {documentType.description && (
                        <p className="text-xs text-gray-500 mt-1">{documentType.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialized Documents */}
          {documentTypes.some(doc => !doc.is_common) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Specialized Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentTypes.filter(doc => !doc.is_common).map((documentType) => {
                  const isRequired = requiredDocuments.some(doc => doc.id === documentType.id);
                  
                  return (
                    <div
                      key={documentType.id}
                      className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isRequired 
                          ? 'border-indigo-200 bg-indigo-50' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleRequirement(documentType)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isRequired 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isRequired && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900">{documentType.name}</h5>
                        {documentType.description && (
                          <p className="text-xs text-gray-500 mt-1">{documentType.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No document types available</h3>
          <p className="text-sm text-gray-500 mb-4">Create document types to set requirements for this program</p>
          <button
            onClick={seedDocumentTypes}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Seed Default Document Types'}
          </button>
        </div>
      )}

      {/* Summary */}
      {requiredDocuments.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">
            Required Documents Summary ({requiredDocuments.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {requiredDocuments.map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {doc.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
