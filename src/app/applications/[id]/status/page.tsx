'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  GraduationCap, 
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Video,
  CreditCard,
  Plane,
  Circle,
  Download,
  Eye,
  Upload,
  Calendar
} from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface Application {
  id: number;
  status: string;
  created_at: string;
  submitted_at?: string;
  offer_letter_requested_at?: string;
  offer_letter_received_at?: string;
  offer_letter_filename?: string;
  offer_letter_original_filename?: string;
  interview_documents_configured_at?: string;
  interview_requested_at?: string;
  interview_scheduled_at?: string;
  interview_date?: string;
  interview_status?: string;
  interview_notes?: string;
  interview_location?: string;
  interview_meeting_link?: string;
  interview_result?: string;
  interview_result_notes?: string;
  interview_result_date?: string;
  cas_documents_configured_at?: string;
  cas_documents_submitted_at?: string;
  cas_applied_at?: string;
  cas_received_at?: string;
  cas_filename?: string;
  cas_original_filename?: string;
  cas_notes?: string;
  
  // Visa fields
  visa_application_enabled_at?: string;
  visa_documents_configured_at?: string;
  visa_documents_submitted_at?: string;
  visa_applied_at?: string;
  visa_received_at?: string;
  visa_filename?: string;
  visa_original_filename?: string;
  visa_notes?: string;
  program?: {
    university_name: string;
    program_name: string;
    city: string;
  };
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

interface InterviewDocument {
  id: number;
  application_id: number;
  document_type_id: number;
  document_name: string;
  description?: string;
  is_required: boolean;
  is_uploaded: boolean;
  uploaded_document_id?: number;
  created_at: string;
}

export default function ApplicationStatusPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Safe date formatting to prevent hydration errors
  const formatDate = (dateString?: string) => {
    if (!mounted || !dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  const [interviewDocuments, setInterviewDocuments] = useState<InterviewDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<number | null>(null);
  const [requestingInterview, setRequestingInterview] = useState(false);
  const [applyingCAS, setApplyingCAS] = useState(false);
  const [applyingVisa, setApplyingVisa] = useState(false);
  const router = useRouter();
  const params = useParams();
  const applicationId = parseInt(params.id as string);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchApplication();
  }, [applicationId, router]);

  useEffect(() => {
    if (application && application.status === 'interview_documents_required') {
      fetchInterviewDocuments();
    }
  }, [application]);

  const fetchApplication = async () => {
    try {
      const response = await applicationsApi.getApplication(applicationId);
      setApplication(response);
    } catch (error: any) {
      console.error('Failed to fetch application:', error);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    try {
      const response = await applicationsApi.downloadOfferLetter(applicationId);
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = application?.offer_letter_original_filename || 'offer-letter.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download offer letter:', error);
      setError('Failed to download offer letter');
    }
  };

  const fetchInterviewDocuments = async () => {
    try {
      const response = await applicationsApi.getInterviewDocuments(applicationId);
      setInterviewDocuments(response);
    } catch (error: any) {
      console.error('Failed to fetch interview documents:', error);
    }
  };

  const handleUploadInterviewDocument = async (documentTypeId: number, file: File) => {
    setUploadingDoc(documentTypeId);
    try {
      await applicationsApi.uploadInterviewDocument(applicationId, documentTypeId, file);
      await fetchInterviewDocuments(); // Refresh the list
      await fetchApplication(); // Refresh application data
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      setError('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleRequestInterview = async () => {
    setRequestingInterview(true);
    try {
      await applicationsApi.requestInterview(applicationId);
      await fetchApplication(); // Refresh application data
    } catch (error: any) {
      console.error('Failed to request interview:', error);
      setError('Failed to request interview');
    } finally {
      setRequestingInterview(false);
    }
  };

  const handleApplyCAS = async () => {
    setApplyingCAS(true);
    try {
      await applicationsApi.applyCAS(applicationId);
      await fetchApplication(); // Refresh application data
    } catch (error: any) {
      console.error('Failed to apply for CAS:', error);
      setError('Failed to apply for CAS');
    } finally {
      setApplyingCAS(false);
    }
  };

  const handleApplyVisa = async () => {
    setApplyingVisa(true);
    try {
      await applicationsApi.applyVisa(applicationId);
      await fetchApplication(); // Refresh application data
    } catch (error: any) {
      console.error('Failed to apply for visa:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to apply for visa';
      setError(errorMessage);
    } finally {
      setApplyingVisa(false);
    }
  };

  const handleDownloadCAS = async () => {
    try {
      const response = await applicationsApi.downloadCAS(applicationId);
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = application?.cas_original_filename || 'cas-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download CAS document:', error);
      setError('Failed to download CAS document');
    }
  };

  const handleDownloadVisa = async () => {
    try {
      const response = await applicationsApi.downloadVisa(applicationId);
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = application?.visa_original_filename || 'visa-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download visa document:', error);
      setError('Failed to download visa document');
    }
  };


  const getProgressSteps = (application: Application): ProgressStep[] => {
    const steps: ProgressStep[] = [
      {
        id: 'submitted',
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted',
        icon: FileText,
        status: 'completed',
        date: application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : undefined
      },
      {
        id: 'under_review',
        title: 'Under Review',
        description: 'University is reviewing your application',
        icon: Eye,
        status: application.status === 'submitted' ? 'current' :
               ['under_review', 'offer_letter_requested', 'offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming'
      },
      {
        id: 'offer_letter_requested',
        title: 'Offer Letter Requested',
        description: 'University offer letter has been requested',
        icon: GraduationCap,
        status: application.status === 'under_review' ? 'current' :
               ['offer_letter_requested', 'offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.offer_letter_requested_at ? new Date(application.offer_letter_requested_at).toLocaleDateString() : undefined
      },
      {
        id: 'offer_letter_received',
        title: 'Offer Letter Received',
        description: 'Your offer letter is ready for download',
        icon: CheckCircle,
        status: application.status === 'offer_letter_requested' ? 'current' :
               ['offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.offer_letter_received_at ? new Date(application.offer_letter_received_at).toLocaleDateString() : undefined
      },
      {
        id: 'interview',
        title: 'Schedule Interview',
        description: application.status === 'interview_documents_required' ? 'Upload required documents for interview' :
                    application.status === 'interview_requested' ? 'Interview request submitted' :
                    application.status === 'interview_scheduled' ? 'Interview scheduled' :
                    application.interview_result === 'pass' ? 'Interview passed' :
                    application.interview_result === 'fail' ? 'Interview failed' :
                    'Interview with admissions team (if required)',
        icon: Video,
        status: application.status === 'offer_letter_received' ? 'current' :
               ['interview_documents_required', 'interview_requested', 'interview_scheduled'].includes(application.status) ? 'current' :
               ['accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.interview_result_date ? new Date(application.interview_result_date).toLocaleDateString() :
              application.interview_scheduled_at ? new Date(application.interview_scheduled_at).toLocaleDateString() : 
              application.interview_requested_at ? new Date(application.interview_requested_at).toLocaleDateString() : undefined
      },
      {
        id: 'cas',
        title: 'Apply for CAS',
        description: application.cas_applied_at ? 'CAS application submitted' :
                    application.cas_received_at ? 'CAS document received' :
                    'Confirmation of Acceptance for Studies',
        icon: CreditCard,
        status: (application.status === 'accepted' && !application.cas_applied_at) || 
               ['cas_documents_required', 'cas_application_in_progress'].includes(application.status) ? 'current' :
               application.cas_applied_at || ['visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.cas_received_at ? new Date(application.cas_received_at).toLocaleDateString() :
              application.cas_applied_at ? new Date(application.cas_applied_at).toLocaleDateString() : undefined
      },
      {
        id: 'visa',
        title: 'Apply for Visa',
        description: application.visa_applied_at ? 'Visa application submitted' :
                    application.visa_received_at ? 'Visa document received' :
                    application.visa_application_enabled_at ? 'Visa application available' :
                    'Student visa application process',
        icon: Plane,
        status: (application.visa_application_enabled_at && !application.visa_applied_at) || 
               ['visa_documents_required', 'visa_application_ready', 'visa_application_in_progress'].includes(application.status) ? 'current' :
               application.visa_applied_at || application.status === 'completed' ? 'completed' : 'upcoming',
        date: application.visa_received_at ? new Date(application.visa_received_at).toLocaleDateString() :
              application.visa_applied_at ? new Date(application.visa_applied_at).toLocaleDateString() : undefined
      }
    ];

    return steps;
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <GraduationCap className="h-5 w-5 animate-pulse" />
            <span className="text-lg font-medium">Loading application status...</span>
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

  const progressSteps = getProgressSteps(application);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation currentPage="applications" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Applications', href: '/applications' },
          { label: 'Application Status' }
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
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Status</h1>
            {application.program && (
              <div className="text-lg text-gray-600">
                <p className="font-semibold">{application.program.program_name}</p>
                <p>{application.program.university_name} • {application.program.city}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">Application ID: #{application.id}</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Application Progress</h2>
          
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Progress Steps */}
            <div className="space-y-8">
              {progressSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isUpcoming = step.status === 'upcoming';
                
                return (
                  <div key={step.id} className="relative flex items-start">
                    {/* Icon Circle */}
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8" />
                      ) : isCurrent ? (
                        <Clock className="h-8 w-8" />
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="ml-8 flex-1">
                      <div className={`p-6 rounded-xl ${
                        isCompleted 
                          ? 'bg-green-50 border border-green-200' 
                          : isCurrent 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-xl font-semibold ${
                            isCompleted 
                              ? 'text-green-900' 
                              : isCurrent 
                                ? 'text-blue-900' 
                                : 'text-gray-600'
                          }`}>
                            {step.title}
                          </h3>
                          
                          {step.date && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                              isCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {step.date}
                            </span>
                          )}
                        </div>
                        
                        <p className={`${
                          isCompleted 
                            ? 'text-green-700' 
                            : isCurrent 
                              ? 'text-blue-700' 
                              : 'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                        
                        {isCurrent && (
                          <div className="mt-4 flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm font-medium">In Progress</span>
                          </div>
                        )}
                        
                        {/* Download offer letter button */}
                        {step.id === 'offer_letter_received' && isCompleted && application.offer_letter_filename && (
                          <div className="mt-4">
                            <button
                              onClick={handleDownloadOfferLetter}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download Offer Letter</span>
                            </button>
                          </div>
                        )}

                        {/* Interview Documents Upload */}
                        {step.id === 'interview' && application.status === 'interview_documents_required' && (
                          <div className="mt-4">
                            <h4 className="font-medium text-blue-900 mb-3">Required Documents for Interview</h4>
                            <div className="space-y-3">
                              {interviewDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900">{doc.document_name}</span>
                                    {doc.description && (
                                      <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    {doc.is_uploaded ? (
                                      <div className="flex items-center space-x-1 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Uploaded</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="file"
                                          id={`file-${doc.id}`}
                                          className="hidden"
                                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleUploadInterviewDocument(doc.document_type_id, file);
                                            }
                                          }}
                                          disabled={uploadingDoc === doc.document_type_id}
                                        />
                                        <label
                                          htmlFor={`file-${doc.id}`}
                                          className={`cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1 ${
                                            uploadingDoc === doc.document_type_id ? 'opacity-50 cursor-not-allowed' : ''
                                          }`}
                                        >
                                          <Upload className="h-3 w-3" />
                                          <span>{uploadingDoc === doc.document_type_id ? 'Uploading...' : 'Upload'}</span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {interviewDocuments.length > 0 && interviewDocuments.every(doc => doc.is_uploaded) && (
                              <div className="mt-4">
                                <button
                                  onClick={handleRequestInterview}
                                  disabled={requestingInterview}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>{requestingInterview ? 'Requesting...' : 'Request Interview'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interview Requested Status */}
                        {step.id === 'interview' && application.status === 'interview_requested' && (
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-800">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Interview request submitted successfully!</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              The admissions team will contact you soon to schedule your interview.
                            </p>
                          </div>
                        )}

                        {/* Interview Scheduled Status */}
                        {step.id === 'interview' && application.status === 'interview_scheduled' && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <div className="flex items-center space-x-2 text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Interview scheduled!</span>
                            </div>
                            {application.interview_date && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Date & Time:</strong> {new Date(application.interview_date).toLocaleDateString()} at {new Date(application.interview_date).toLocaleTimeString()}
                              </p>
                            )}
                            {application.interview_location && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Location:</strong> {application.interview_location}
                              </p>
                            )}
                            {application.interview_meeting_link && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Meeting Link:</strong> <a href={application.interview_meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{application.interview_meeting_link}</a>
                              </p>
                            )}
                            {application.interview_notes && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Notes:</strong> {application.interview_notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Interview Result Status */}
                        {step.id === 'interview' && application.interview_result && (
                          <div className={`mt-4 p-3 rounded-lg ${
                            application.interview_result === 'pass' 
                              ? 'bg-green-100 border border-green-200' 
                              : 'bg-red-100 border border-red-200'
                          }`}>
                            <div className="flex items-center space-x-2">
                              {application.interview_result === 'pass' ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-800">Interview Passed!</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-800">Interview Not Passed</span>
                                </>
                              )}
                            </div>
                            {application.interview_result_date && (
                              <p className={`text-sm mt-1 ${
                                application.interview_result === 'pass' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <strong>Result Date:</strong> {new Date(application.interview_result_date).toLocaleDateString()}
                              </p>
                            )}
                            {application.interview_result_notes && (
                              <p className={`text-sm mt-1 ${
                                application.interview_result === 'pass' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <strong>Notes:</strong> {application.interview_result_notes}
                              </p>
                            )}
                            {application.interview_result === 'pass' && (
                              <p className="text-sm text-green-700 mt-2 font-medium">
                                🎉 Congratulations! You can now apply for CAS.
                              </p>
                            )}
                            {application.interview_result === 'fail' && (
                              <p className="text-sm text-red-700 mt-2">
                                Unfortunately, your application has been rejected. Please contact support if you have any questions.
                              </p>
                            )}
                          </div>
                        )}

                        {/* CAS Application */}
                        {step.id === 'cas' && application.status === 'accepted' && !application.cas_applied_at && (
                          <div className="mt-4">
                            <button
                              onClick={handleApplyCAS}
                              disabled={applyingCAS}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CreditCard className="h-4 w-4" />
                              <span>{applyingCAS ? 'Applying...' : 'Apply for CAS'}</span>
                            </button>
                          </div>
                        )}

                        {/* CAS Applied Status */}
                        {step.id === 'cas' && application.cas_applied_at && !application.cas_received_at && (
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-800">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">CAS Application Submitted</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              Applied on: {new Date(application.cas_applied_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              The admin will process your CAS application and upload the document when ready.
                            </p>
                          </div>
                        )}

                        {/* CAS Received Status */}
                        {step.id === 'cas' && application.cas_received_at && application.cas_original_filename && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2 text-green-800">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-medium">CAS Document Ready!</span>
                                </div>
                                <p className="text-sm text-green-700 mt-1">
                                  Received on: {new Date(application.cas_received_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-green-700">
                                  File: {application.cas_original_filename}
                                </p>
                                <p className="text-sm text-green-700 mt-2 font-medium">
                                  🎉 Visa application is now available!
                                </p>
                              </div>
                              <button
                                onClick={handleDownloadCAS}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download CAS</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Visa Application */}
                        {step.id === 'visa' && application.visa_application_enabled_at && !application.visa_applied_at && (
                          <div className="mt-4">
                            <button
                              onClick={handleApplyVisa}
                              disabled={applyingVisa}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plane className="h-4 w-4" />
                              <span>{applyingVisa ? 'Applying...' : 'Apply for Visa'}</span>
                            </button>
                          </div>
                        )}

                        {/* Visa Applied Status */}
                        {step.id === 'visa' && application.visa_applied_at && !application.visa_received_at && (
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-800">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Visa Application Submitted</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              Applied on: {new Date(application.visa_applied_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              The admin will process your visa application and upload the document when ready.
                            </p>
                          </div>
                        )}

                        {/* Visa Received Status */}
                        {step.id === 'visa' && application.visa_received_at && application.visa_original_filename && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2 text-green-800">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-medium">Visa Document Ready!</span>
                                </div>
                                <p className="text-sm text-green-700 mt-1">
                                  Received on: {new Date(application.visa_received_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-green-700">
                                  File: {application.visa_original_filename}
                                </p>
                                <p className="text-sm text-green-700 mt-2 font-medium">
                                  🎉 Congratulations! Your application journey is complete!
                                </p>
                              </div>
                              <button
                                onClick={handleDownloadVisa}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download Visa</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Important Information</h3>
          <div className="space-y-2 text-blue-800">
            <p>• You'll receive email notifications for each step of the process</p>
            <p>• The review process typically takes 2-4 weeks</p>
            <p>• Keep your contact information up to date</p>
            <p>• Check your email regularly for updates and requests</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4 justify-center">
          <button
            onClick={() => router.push('/applications')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View All Applications
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
