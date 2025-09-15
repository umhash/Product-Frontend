'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  GraduationCap, 
  MapPin, 
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Send,
  X
} from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface RequiredDocument {
  id: number;
  document_type: string;
  document_name: string;
  description?: string;
  is_required: boolean;
}

interface ApplicationDocument {
  id: number;
  document_type: string;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

interface Application {
  id: number;
  program_id: number;
  status: string;
  personal_statement?: string;
  additional_notes?: string;
  created_at: string;
  documents: ApplicationDocument[];
  program?: {
    university_name: string;
    program_name: string;
    program_level: string;
    city: string;
    field_of_study: string;
  };
}

export default function ApplicationDetailPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [personalStatement, setPersonalStatement] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const applicationId = parseInt(params.id as string);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId, router]);

  const fetchApplicationDetails = async () => {
    try {
      const [appResponse, docsResponse] = await Promise.all([
        applicationsApi.getApplication(applicationId),
        applicationsApi.getRequiredDocuments(applicationId)
      ]);
      
      setApplication(appResponse);
      setRequiredDocuments(docsResponse);
      setPersonalStatement(appResponse.personal_statement || '');
      setAdditionalNotes(appResponse.additional_notes || '');
    } catch (error: any) {
      console.error('Failed to fetch application details:', error);
      setError(error.response?.data?.detail || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    try {
      await applicationsApi.uploadDocument(applicationId, documentType, file);
      await fetchApplicationDetails(); // Refresh to show uploaded document
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      alert(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDownloadDocument = async (documentId: number, filename: string) => {
    try {
      const response = await applicationsApi.downloadDocument(applicationId, documentId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download document:', error);
      alert('Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await applicationsApi.deleteDocument(applicationId, documentId);
      await fetchApplicationDetails(); // Refresh to remove deleted document
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      alert(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      await applicationsApi.submitApplication(applicationId, personalStatement, additionalNotes);
      router.push(`/applications/${applicationId}/status`);
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      alert(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadedDocument = (documentType: string) => {
    return application?.documents.find(doc => doc.document_type === documentType);
  };

  const isAllRequiredDocumentsUploaded = () => {
    const requiredTypes = requiredDocuments.filter(doc => doc.is_required).map(doc => doc.document_type);
    const uploadedTypes = application?.documents.map(doc => doc.document_type) || [];
    return requiredTypes.every(type => uploadedTypes.includes(type));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <GraduationCap className="h-5 w-5 animate-pulse" />
            <span className="text-lg font-medium">Loading application...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/applications')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const canEdit = application.status === 'draft';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation currentPage="applications" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Applications', href: '/applications' },
          { label: application.program?.program_name || 'Application' }
        ]} />

        {/* Back Button */}
        <button
          onClick={() => router.push('/applications')}
          className="mb-6 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Applications</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{application.program?.program_name}</h1>
              <p className="text-2xl text-purple-100 mb-4">{application.program?.university_name}</p>
              <div className="flex items-center space-x-6 text-purple-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{application.program?.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>{application.program?.program_level}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-full ${
                application.status === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {application.status === 'draft' ? 'Draft' : 'Submitted'}
              </div>
            </div>
          </div>
        </div>

        {!canEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>This application has been submitted and can no longer be edited.</span>
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Required Documents */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <FileText className="h-6 w-6 text-purple-600" />
                <span>Required Documents</span>
              </h2>

              <div className="space-y-4">
                {requiredDocuments.map((reqDoc) => {
                  const uploadedDoc = getUploadedDocument(reqDoc.document_type);
                  
                  return (
                    <div key={reqDoc.id} className={`border rounded-lg p-4 ${
                      uploadedDoc ? 'border-green-200 bg-green-50' : 
                      reqDoc.is_required ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{reqDoc.document_name}</h3>
                            {reqDoc.is_required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                            )}
                          </div>
                          {reqDoc.description && (
                            <p className="text-sm text-gray-600 mb-3">{reqDoc.description}</p>
                          )}
                          
                          {uploadedDoc ? (
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{uploadedDoc.original_filename}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(uploadedDoc.file_size)} • 
                                  Uploaded {new Date(uploadedDoc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-gray-500">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="text-sm">Not uploaded</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          {uploadedDoc ? (
                            <>
                              <button
                                onClick={() => handleDownloadDocument(uploadedDoc.id, uploadedDoc.original_filename)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteDocument(uploadedDoc.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : canEdit ? (
                            <div className="relative">
                              <input
                                type="file"
                                id={`upload-${reqDoc.document_type}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(reqDoc.document_type, file);
                                  }
                                }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                              <label
                                htmlFor={`upload-${reqDoc.document_type}`}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                                  uploading === reqDoc.document_type
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {uploading === reqDoc.document_type ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4" />
                                    <span>Upload</span>
                                  </>
                                )}
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Statement */}
            {canEdit && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Statement</h2>
                <textarea
                  value={personalStatement}
                  onChange={(e) => setPersonalStatement(e.target.value)}
                  placeholder="Write your personal statement here..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Additional Notes */}
            {canEdit && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Notes</h2>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional information you'd like to include..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Application Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents Uploaded</span>
                  <span className="font-semibold">
                    {application.documents.length} / {requiredDocuments.filter(d => d.is_required).length}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(application.documents.length / requiredDocuments.filter(d => d.is_required).length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Submit Application */}
            {canEdit && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Submit?</h3>
                
                {isAllRequiredDocumentsUploaded() ? (
                  <div>
                    <div className="flex items-center space-x-2 text-green-600 mb-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm">All required documents uploaded</span>
                    </div>
                    <button
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 text-yellow-600 mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">Please upload all required documents</span>
                    </div>
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed"
                    >
                      Submit Application
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
