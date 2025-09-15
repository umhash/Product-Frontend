'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { programsApi, documentsApi } from '@/lib/adminApi';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CalendarIcon,
  AcademicCapIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import PDFUpload from '@/components/admin/PDFUpload';
import DocumentRequirements from '@/components/admin/DocumentRequirements';

interface Program {
  id: number;
  university_name: string;
  program_name: string;
  program_level: string;
  field_of_study: string;
  city: string;
  duration_months: number | null;
  intake_months: number[];
  program_description: string | null;
  is_active: boolean;
  created_at: string;
  
  // Entry requirements
  min_ielts_overall: number | null;
  min_ielts_components: number | null;
  min_toefl_overall: number | null;
  min_pte_overall: number | null;
  min_gpa_4_scale: number | null;
  min_percentage: number | null;
  required_qualification: string | null;
  
  // Financial
  tuition_fee_gbp: number | null;
  living_cost_gbp: number | null;
  
  // Documents
  documents: any[];
}

export default function ProgramDetail() {
  const params = useParams();
  const router = useRouter();
  const programId = parseInt(params.id as string);
  
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      setError('');
      const programData = await programsApi.getProgram(programId);
      setProgram(programData);
    } catch (error: any) {
      setError('Failed to load program details');
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!program || !confirm(`Are you sure you want to delete "${program.program_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      await programsApi.deleteProgram(programId);
      router.push('/admin/programs');
    } catch (error: any) {
      alert('Failed to delete program: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsApi.deleteDocument(documentId);
      loadProgram(); // Reload to update document list
    } catch (error: any) {
      alert('Failed to delete document: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDocumentDownload = async (documentId: number, filename: string) => {
    try {
      const response = await documentsApi.downloadDocument(documentId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to download document: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      await programsApi.uploadDocuments(programId, files as any);
      setShowUpload(false);
      loadProgram(); // Reload to show new documents
    } catch (error: any) {
      alert('Failed to upload documents: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const formatIntakeMonths = (months: number[]) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months.map(m => monthNames[m - 1]).join(', ');
  };

  const formatCurrency = (amount: number | null) => {
    return amount ? `£${amount.toLocaleString()}` : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Program not found'}</div>
        <Link
          href="/admin/programs"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Programs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/programs"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Programs
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/programs/${programId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
          >
            {deleteLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <TrashIcon className="h-4 w-4 mr-2" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Program Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{program.program_name}</h1>
            <p className="mt-1 text-lg text-gray-600">{program.university_name}</p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <AcademicCapIcon className="h-4 w-4 mr-1" />
                <span className="capitalize">{program.program_level}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>{program.city}</span>
              </div>
              {program.duration_months && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{program.duration_months} months</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              program.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {program.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {program.program_description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{program.program_description}</p>
          </div>
        )}
      </div>

      {/* Program Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Entry Requirements */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Entry Requirements</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Field of Study</dt>
              <dd className="text-sm text-gray-900">{program.field_of_study}</dd>
            </div>
            {program.required_qualification && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Required Qualification</dt>
                <dd className="text-sm text-gray-900">{program.required_qualification}</dd>
              </div>
            )}
            {program.min_ielts_overall && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min IELTS Overall</dt>
                <dd className="text-sm text-gray-900">{program.min_ielts_overall}</dd>
              </div>
            )}
            {program.min_ielts_components && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min IELTS Components</dt>
                <dd className="text-sm text-gray-900">{program.min_ielts_components}</dd>
              </div>
            )}
            {program.min_toefl_overall && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min TOEFL Overall</dt>
                <dd className="text-sm text-gray-900">{program.min_toefl_overall}</dd>
              </div>
            )}
            {program.min_pte_overall && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min PTE Overall</dt>
                <dd className="text-sm text-gray-900">{program.min_pte_overall}</dd>
              </div>
            )}
            {program.min_gpa_4_scale && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min GPA (4.0 scale)</dt>
                <dd className="text-sm text-gray-900">{program.min_gpa_4_scale}</dd>
              </div>
            )}
            {program.min_percentage && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Min Percentage</dt>
                <dd className="text-sm text-gray-900">{program.min_percentage}%</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Program Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Program Information</h3>
          <dl className="space-y-3">
            {program.intake_months.length > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Intake Months</dt>
                <dd className="text-sm text-gray-900">{formatIntakeMonths(program.intake_months)}</dd>
              </div>
            )}
            {program.tuition_fee_gbp && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Tuition Fee</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(program.tuition_fee_gbp)}</dd>
              </div>
            )}
            {program.living_cost_gbp && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Living Cost</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(program.living_cost_gbp)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">
                {new Date(program.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Document Requirements Section */}
      <DocumentRequirements programId={programId} />

      {/* Documents */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Documents ({program.documents.length})
          </h3>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload Documents
          </button>
        </div>

        {showUpload && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <PDFUpload
              onFilesSelected={handleFileUpload}
              isUploading={isUploading}
              maxFiles={10}
            />
          </div>
        )}

        {program.documents.length > 0 ? (
          <div className="space-y-3">
            {program.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDocumentDownload(doc.id, doc.original_filename)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDocumentDelete(doc.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload PDF documents for this program.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
