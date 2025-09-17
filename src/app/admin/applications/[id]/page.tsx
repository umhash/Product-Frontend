'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  GraduationCap, 
  ArrowLeft,
  User,
  FileText,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Calendar,
  CreditCard,
  Settings,
  Mail,
  Edit3
} from 'lucide-react';
import adminApi, { adminApplicationsApi, documentTypesApi } from '@/lib/adminApi';
import OfferLetterEmailEditor from '@/components/admin/OfferLetterEmailEditor';

interface Application {
  id: number;
  status: string;
  created_at: string;
  submitted_at?: string;
  offer_letter_requested_at?: string;
  offer_letter_received_at?: string;
  offer_letter_filename?: string;
  offer_letter_original_filename?: string;
  offer_letter_size?: number;
  // Email draft fields
  offer_letter_email_draft?: string;
  offer_letter_email_generated_at?: string;
  offer_letter_email_edited_by_admin?: boolean;
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
  cas_size?: number;
  cas_notes?: string;
  
  // Visa fields
  visa_application_enabled_at?: string;
  personal_statement?: string;
  additional_notes?: string;
  admin_notes?: string;
  decision_reason?: string;
  documents: any[];
  student: {
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    country_of_origin?: string;
  } | null;
  program: {
    id: number;
    university_name: string;
    program_name: string;
    program_level: string;
    city: string;
    field_of_study: string;
  } | null;
}

interface DocumentType {
  id: number;
  name: string;
  description?: string;
  is_common: boolean;
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

interface CASDocument {
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

interface VisaDocument {
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

export default function AdminApplicationDetailsPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Safe date formatting to prevent hydration errors
  const formatDate = (dateString?: string) => {
    if (!mounted || !dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  const [actionLoading, setActionLoading] = useState(false);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<number[]>([]);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [showInterviewConfig, setShowInterviewConfig] = useState(false);
  const [interviewDocuments, setInterviewDocuments] = useState<InterviewDocument[]>([]);
  const [casDocuments, setCasDocuments] = useState<CASDocument[]>([]);
  const [visaDocuments, setVisaDocuments] = useState<VisaDocument[]>([]);
  const [showInterviewScheduling, setShowInterviewScheduling] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('');
  const [interviewScheduleNotes, setInterviewScheduleNotes] = useState('');
  const [showInterviewResult, setShowInterviewResult] = useState(false);
  const [interviewResult, setInterviewResult] = useState<'pass' | 'fail'>('pass');
  const [interviewResultNotes, setInterviewResultNotes] = useState('');
  const [casFile, setCasFile] = useState<File | null>(null);
  const [uploadingCAS, setUploadingCAS] = useState(false);
  
  // CAS Document Configuration
  const [showCASConfig, setShowCASConfig] = useState(false);
  const [selectedCASDocumentTypes, setSelectedCASDocumentTypes] = useState<number[]>([]);
  const [casNotes, setCasNotes] = useState('');
  
  // Visa Document Configuration
  const [showVisaConfig, setShowVisaConfig] = useState(false);
  const [selectedVisaDocumentTypes, setSelectedVisaDocumentTypes] = useState<number[]>([]);
  const [visaNotes, setVisaNotes] = useState('');
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [uploadingVisa, setUploadingVisa] = useState(false);
  
  // Email Editor State
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [requestingOffer, setRequestingOffer] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const applicationId = parseInt(params.id as string);

  useEffect(() => {
    setMounted(true);
    fetchApplication();
    fetchDocumentTypes();
  }, [applicationId]);

  useEffect(() => {
    if (application && application.status === 'interview_documents_required') {
      fetchInterviewDocuments();
    }
    if (application && (application.status === 'cas_documents_required' || application.cas_documents_configured_at)) {
      fetchCASDocuments();
    }
    if (application && (application.status === 'visa_documents_required' || application.visa_documents_configured_at)) {
      fetchVisaDocuments();
    }
    // Auto-prompt admin to configure visa docs right after CAS upload enables visa
    if (application && application.visa_application_enabled_at && !application.visa_documents_configured_at) {
      setShowVisaConfig(true);
    }
  }, [application]);

  const fetchApplication = async () => {
    try {
      const response = await adminApi.get(`/admin/api/applications/${applicationId}`);
      setApplication(response.data);
    } catch (error: any) {
      console.error('Failed to fetch application:', error);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAndRequestOffer = async () => {
    try {
      setRequestingOffer(true);
      await adminApplicationsApi.requestOfferLetter(applicationId, true);
      await fetchApplication();
    } catch (error: any) {
      console.error('Failed to request offer letter:', error);
      setError('Failed to request offer letter');
    } finally {
      setRequestingOffer(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await documentTypesApi.getDocumentTypes();
      // The API returns DocumentTypeListResponse with document_types array
      const types = response?.document_types || [];
      setDocumentTypes(types);
    } catch (error: any) {
      console.error('Failed to fetch document types:', error);
      setDocumentTypes([]); // Set empty array on error
    }
  };

  const fetchInterviewDocuments = async () => {
    try {
      const response = await adminApplicationsApi.getInterviewDocuments(applicationId);
      setInterviewDocuments(response);
    } catch (error: any) {
      console.error('Failed to fetch interview documents:', error);
    }
  };

  const fetchCASDocuments = async () => {
    try {
      const response = await adminApplicationsApi.getCASDocuments(applicationId);
      setCasDocuments(response);
    } catch (error: any) {
      console.error('Failed to fetch CAS documents:', error);
    }
  };

  const fetchVisaDocuments = async () => {
    try {
      const response = await adminApplicationsApi.getVisaDocuments(applicationId);
      setVisaDocuments(response);
    } catch (error: any) {
      console.error('Failed to fetch visa documents:', error);
    }
  };

  const handleOpenOfferLetterModal = async () => {
    setEmailError('');
    setShowEmailEditor(true);
  };

  const handleUploadOfferLetter = async () => {
    if (!offerLetterFile) return;
    
    setUploadProgress(true);
    try {
      const formData = new FormData();
      formData.append('file', offerLetterFile);
      
      await adminApi.post(`/admin/api/applications/${applicationId}/upload-offer-letter`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setOfferLetterFile(null);
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to upload offer letter:', error);
      setError('Failed to upload offer letter');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    try {
      const response = await adminApplicationsApi.downloadOfferLetter(applicationId);
      
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

  // Email handling functions
  const handleGenerateEmail = async (): Promise<string> => {
    setIsGeneratingEmail(true);
    setEmailError('');
    
    try {
      // Single invocation guard when modal opens
      if ((window as any).__offer_email_gen_lock__) {
        // If already in-flight, wait briefly and try to read from state
        await new Promise((r) => setTimeout(r, 200));
      }
      (window as any).__offer_email_gen_lock__ = true;
      const response = await adminApplicationsApi.generateOfferLetterEmail(applicationId);
      // Update local state immediately so UI shows content without a second request
      if (application) {
        setApplication({ ...application, offer_letter_email_draft: response.email_draft });
      }
      return response.email_draft;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate email';
      setEmailError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGeneratingEmail(false);
      (window as any).__offer_email_gen_lock__ = false;
    }
  };

  const handleSaveEmail = async (emailContent: string): Promise<void> => {
    setIsSavingEmail(true);
    setEmailError('');
    
    try {
      await adminApplicationsApi.updateOfferLetterEmailDraft(applicationId, emailContent);
      await fetchApplication();
      setShowEmailEditor(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save email';
      setEmailError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleShowEmailEditor = () => {
    setEmailError('');
    setShowEmailEditor(true);
  };

  const handleCloseEmailEditor = () => {
    setShowEmailEditor(false);
    setEmailError('');
  };

  const handleConfigureInterview = async () => {
    if (selectedDocumentTypes.length === 0) {
      setError('Please select at least one document type');
      return;
    }

    setActionLoading(true);
    try {
      await adminApplicationsApi.configureInterviewDocuments(
        applicationId, 
        selectedDocumentTypes, 
        interviewNotes || undefined
      );
      setShowInterviewConfig(false);
      setSelectedDocumentTypes([]);
      setInterviewNotes('');
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to configure interview documents:', error);
      setError('Failed to configure interview documents');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigureCAS = async () => {
    if (selectedCASDocumentTypes.length === 0) {
      setError('Please select at least one document type for CAS');
      return;
    }

    setActionLoading(true);
    try {
      await adminApplicationsApi.configureCASDocuments(
        applicationId, 
        selectedCASDocumentTypes, 
        casNotes || undefined
      );
      setShowCASConfig(false);
      setSelectedCASDocumentTypes([]);
      setCasNotes('');
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to configure CAS documents:', error);
      setError('Failed to configure CAS documents');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigureVisa = async () => {
    if (selectedVisaDocumentTypes.length === 0) {
      setError('Please select at least one document type for visa');
      return;
    }

    setActionLoading(true);
    try {
      await adminApplicationsApi.configureVisaDocuments(
        applicationId, 
        selectedVisaDocumentTypes, 
        visaNotes || undefined
      );
      setShowVisaConfig(false);
      setSelectedVisaDocumentTypes([]);
      setVisaNotes('');
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to configure visa documents:', error);
      setError('Failed to configure visa documents');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate) {
      setError('Please select interview date and time');
      return;
    }

    setActionLoading(true);
    try {
      await adminApplicationsApi.scheduleInterview(applicationId, {
        interview_date: interviewDate,
        interview_location: interviewLocation || undefined,
        interview_meeting_link: interviewMeetingLink || undefined,
        interview_notes: interviewScheduleNotes || undefined
      });
      setShowInterviewScheduling(false);
      setInterviewDate('');
      setInterviewLocation('');
      setInterviewMeetingLink('');
      setInterviewScheduleNotes('');
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      setError('Failed to schedule interview');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkInterviewResult = async () => {
    setActionLoading(true);
    try {
      await adminApplicationsApi.markInterviewResult(
        applicationId, 
        interviewResult,
        interviewResultNotes || undefined
      );
      setShowInterviewResult(false);
      setInterviewResultNotes('');
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to mark interview result:', error);
      setError('Failed to mark interview result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadCAS = async () => {
    if (!casFile) return;
    
    setUploadingCAS(true);
    try {
      await adminApplicationsApi.uploadCAS(applicationId, casFile);
      setCasFile(null);
      await fetchApplication(); // Refresh data
    } catch (error: any) {
      console.error('Failed to upload CAS:', error);
      setError('Failed to upload CAS document');
    } finally {
      setUploadingCAS(false);
    }
  };

  const handleDownloadCAS = async () => {
    try {
      const response = await adminApplicationsApi.downloadCAS(applicationId);
      
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
      console.error('Failed to download CAS:', error);
      setError('Failed to download CAS document');
    }
  };

  const handleUploadVisa = async () => {
    if (!visaFile) {
      setError('Please select a visa file to upload');
      return;
    }

    setUploadingVisa(true);
    try {
      await adminApplicationsApi.uploadVisa(applicationId, visaFile);
      setVisaFile(null);
      await fetchApplication(); // Refresh data
      setError('');
    } catch (error: any) {
      console.error('Failed to upload visa:', error);
      setError('Failed to upload visa');
    } finally {
      setUploadingVisa(false);
    }
  };

  const handleDownloadVisa = async () => {
    try {
      const response = await adminApplicationsApi.downloadVisa(applicationId);
      
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
      console.error('Failed to download visa:', error);
      setError('Failed to download visa document');
    }
  };

  const getAdminProgressSteps = (application: Application) => {
    const steps = [
      {
        id: 'submitted',
        title: 'Application Submitted',
        description: 'Student submitted their application',
        icon: FileText,
        status: 'completed',
        date: application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : undefined,
        completed: !!application.submitted_at
      },
      {
        id: 'under_review',
        title: 'Under Review',
        description: 'Application is being reviewed',
        icon: Clock,
        status: application.status === 'submitted' ? 'current' :
               ['under_review', 'offer_letter_requested', 'offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected'].includes(application.status) ? 'completed' : 'upcoming',
        completed: ['under_review', 'offer_letter_requested', 'offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected'].includes(application.status)
      },
      {
        id: 'offer_letter_requested',
        title: 'Offer Letter Requested',
        description: 'University offer letter has been requested',
        icon: Send,
        status: application.status === 'under_review' ? 'current' :
               ['offer_letter_requested', 'offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.offer_letter_requested_at ? new Date(application.offer_letter_requested_at).toLocaleDateString() : undefined,
        completed: !!application.offer_letter_requested_at
      },
      {
        id: 'offer_letter_received',
        title: 'Offer Letter Received',
        description: 'Offer letter uploaded and available',
        icon: CheckCircle,
        status: application.status === 'offer_letter_requested' ? 'current' :
               ['offer_letter_received', 'interview_documents_required', 'interview_requested', 'interview_scheduled', 'accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.offer_letter_received_at ? new Date(application.offer_letter_received_at).toLocaleDateString() : undefined,
        completed: !!application.offer_letter_received_at
      },
      {
        id: 'interview',
        title: 'Interview Process',
        description: application.status === 'interview_documents_required' ? 'Interview documents configured' :
                    application.status === 'interview_requested' ? 'Student requested interview' :
                    application.status === 'interview_scheduled' ? 'Interview scheduled' :
                    application.interview_result === 'pass' ? 'Interview passed' :
                    application.interview_result === 'fail' ? 'Interview failed' :
                    'Interview process',
        icon: Calendar,
        status: application.status === 'offer_letter_received' ? 'current' :
               ['interview_documents_required', 'interview_requested', 'interview_scheduled'].includes(application.status) ? 'current' :
               ['accepted', 'rejected', 'cas_documents_required', 'cas_application_in_progress', 'visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.interview_result_date ? new Date(application.interview_result_date).toLocaleDateString() :
              application.interview_scheduled_at ? new Date(application.interview_scheduled_at).toLocaleDateString() : 
              application.interview_requested_at ? new Date(application.interview_requested_at).toLocaleDateString() :
              application.interview_documents_configured_at ? new Date(application.interview_documents_configured_at).toLocaleDateString() : undefined,
        completed: !!application.interview_result
      },
      {
        id: 'cas',
        title: 'CAS Application',
        description: application.cas_applied_at ? 'Student applied for CAS' :
                    application.cas_received_at ? 'CAS document uploaded' :
                    'CAS application process',
        icon: CreditCard,
        status: (application.status === 'accepted' && !application.cas_applied_at) || 
               ['cas_documents_required', 'cas_application_in_progress'].includes(application.status) ? 'current' :
               application.cas_applied_at || ['visa_documents_required', 'visa_application_ready', 'visa_application_in_progress', 'completed'].includes(application.status) ? 'completed' : 'upcoming',
        date: application.cas_received_at ? new Date(application.cas_received_at).toLocaleDateString() :
              application.cas_applied_at ? new Date(application.cas_applied_at).toLocaleDateString() : undefined,
        completed: !!application.cas_received_at
      },
      {
        id: 'visa',
        title: 'Visa Application',
        description: application.visa_applied_at ? 'Student applied for visa' :
                    application.visa_received_at ? 'Visa document uploaded' :
                    application.visa_application_enabled_at ? 'Visa application available' :
                    'Visa application process',
        icon: CreditCard,
        status: (application.visa_application_enabled_at && !application.visa_applied_at) || 
               ['visa_documents_required', 'visa_application_ready', 'visa_application_in_progress'].includes(application.status) ? 'current' :
               application.visa_applied_at || application.status === 'completed' ? 'completed' : 'upcoming',
        date: application.visa_received_at ? new Date(application.visa_received_at).toLocaleDateString() :
              application.visa_applied_at ? new Date(application.visa_applied_at).toLocaleDateString() : undefined,
        completed: !!application.visa_received_at
      }
    ];

    return steps;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Submitted'
        };
      case 'under_review':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Under Review'
        };
      case 'offer_letter_requested':
        return {
          icon: Send,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'Offer Letter Requested'
        };
      case 'offer_letter_received':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Offer Letter Received'
        };
      case 'interview_documents_required':
        return {
          icon: FileText,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Interview Documents Required'
        };
      case 'interview_requested':
        return {
          icon: Calendar,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          label: 'Interview Requested'
        };
      case 'interview_scheduled':
        return {
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Interview Scheduled'
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Accepted'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Rejected'
        };
      case 'cas_documents_required':
        return {
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'CAS Documents Required'
        };
      case 'cas_application_in_progress':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'CAS Application In Progress'
        };
      case 'visa_documents_required':
        return {
          icon: FileText,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          label: 'Visa Documents Required'
        };
      case 'visa_application_ready':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Visa Application Ready'
        };
      case 'visa_application_in_progress':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Visa Application In Progress'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: status
        };
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/admin/applications')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/applications')}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Applications</span>
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <span>Application Details</span>
        </h1>
        <p className="text-gray-600 mt-2">Application ID: #{application.id}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
              <p className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
            </div>
          </div>
          
          {application.submitted_at && (
            <div className="text-right text-sm text-gray-500">
              <p>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Progress</h3>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Progress Steps */}
          <div className="space-y-6">
            {getAdminProgressSteps(application).map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.status === 'completed' || step.completed;
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
                  <div className="ml-6 flex-1">
                    <div className={`p-4 rounded-xl ${
                      isCompleted 
                        ? 'bg-green-50 border border-green-200' 
                        : isCurrent 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-lg font-semibold ${
                          isCompleted 
                            ? 'text-green-900' 
                            : isCurrent 
                              ? 'text-blue-900' 
                              : 'text-gray-600'
                        }`}>
                          {step.title}
                        </h4>
                        
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

                      {/* Show completed step details for admin visibility */}
                      {step.id === 'submitted' && isCompleted && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <h6 className="font-medium text-green-900 mb-2">Initial Application Submission:</h6>
                          <div className="space-y-2 text-sm text-green-800">
                            <p><strong>Submitted:</strong> {application.submitted_at ? new Date(application.submitted_at).toLocaleString() : 'N/A'}</p>
                            {application.personal_statement && (
                              <div>
                                <strong>Personal Statement:</strong>
                                <div className="mt-1 p-2 bg-white rounded border max-h-20 overflow-y-auto text-gray-700">
                                  {application.personal_statement}
                                </div>
                              </div>
                            )}
                            {application.additional_notes && (
                              <div>
                                <strong>Additional Notes:</strong>
                                <div className="mt-1 p-2 bg-white rounded border max-h-20 overflow-y-auto text-gray-700">
                                  {application.additional_notes}
                                </div>
                              </div>
                            )}
                            {application.documents && application.documents.filter(doc => 
                              !interviewDocuments.some(intDoc => intDoc.document_name === doc.document_type) &&
                              doc.document_type !== 'offer_letter' &&
                              doc.document_type !== 'cas_document'
                            ).length > 0 && (
                              <div>
                                <strong>Initial Documents Submitted ({application.documents.filter(doc => 
                                  !interviewDocuments.some(intDoc => intDoc.document_name === doc.document_type) &&
                                  doc.document_type !== 'offer_letter' &&
                                  doc.document_type !== 'cas_document'
                                ).length}):</strong>
                                <div className="mt-1 space-y-1">
                                  {application.documents
                                    .filter(doc => 
                                      !interviewDocuments.some(intDoc => intDoc.document_name === doc.document_type) &&
                                      doc.document_type !== 'offer_letter' &&
                                      doc.document_type !== 'cas_document'
                                    )
                                    .map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <div className="flex-1">
                                          <span className="font-medium text-gray-900">{doc.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                          <p className="text-xs text-gray-500">{doc.original_filename} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                          <p className="text-xs text-gray-400">Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
                                        </div>
                                        <button
                                          onClick={() => window.open(`/admin/api/applications/${applicationId}/documents/${doc.id}/download`, '_blank')}
                                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                                        >
                                          <Download className="h-3 w-3" />
                                          <span>Download</span>
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {step.id === 'offer_letter_requested' && application.offer_letter_requested_at && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <h6 className="font-medium text-purple-900 mb-2">Offer Letter Request Details:</h6>
                          <div className="space-y-2 text-sm text-purple-800">
                            <p><strong>Requested:</strong> {new Date(application.offer_letter_requested_at).toLocaleString()}</p>
                            <p><strong>Status:</strong> {application.status === 'offer_letter_requested' ? 'Waiting for upload' : 'Completed'}</p>
                            {application.admin_notes && (
                              <div>
                                <strong>Admin Notes:</strong>
                                <div className="mt-1 p-2 bg-white rounded border text-gray-700">
                                  {application.admin_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {step.id === 'offer_letter_received' && application.offer_letter_received_at && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <h6 className="font-medium text-green-900 mb-2">Offer Letter Upload Details:</h6>
                          <div className="space-y-2 text-sm text-green-800">
                            <p><strong>Uploaded by Admin:</strong> {new Date(application.offer_letter_received_at).toLocaleString()}</p>
                            <p><strong>File:</strong> {application.offer_letter_original_filename}</p>
                            <p><strong>Size:</strong> {application.offer_letter_size ? (application.offer_letter_size / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={handleDownloadOfferLetter}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download Offer Letter</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {step.id === 'interview' && (application.interview_documents_configured_at || application.interview_requested_at || application.interview_scheduled_at || application.interview_result) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <h6 className="font-medium text-blue-900 mb-2">Interview Process Timeline:</h6>
                          <div className="space-y-3 text-sm text-blue-800">
                            
                            {/* Interview Documents Configuration */}
                            {application.interview_documents_configured_at && (
                              <div className="p-2 bg-white rounded border">
                                <p><strong>1. Documents Configured by Admin:</strong> {new Date(application.interview_documents_configured_at).toLocaleString()}</p>
                                {application.interview_notes && (
                                  <div className="mt-2">
                                    <strong>Configuration Notes:</strong>
                                    <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700 text-xs">
                                      {application.interview_notes}
                                    </div>
                                  </div>
                                )}
                                {interviewDocuments.length > 0 && (
                                  <div className="mt-2">
                                    <strong>Required Documents ({interviewDocuments.length}):</strong>
                                    <div className="mt-1 space-y-1">
                                      {interviewDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-1 bg-gray-50 rounded">
                                          <span className="text-xs font-medium text-gray-900">{doc.document_name}</span>
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            doc.is_uploaded 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-orange-100 text-orange-800'
                                          }`}>
                                            {doc.is_uploaded ? 'Uploaded by Student' : 'Pending Upload'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Interview Documents Uploaded by Student */}
                            {application.documents && application.documents.filter(doc => 
                              interviewDocuments.some(intDoc => intDoc.document_name === doc.document_type)
                            ).length > 0 && (
                              <div className="p-2 bg-white rounded border">
                                <strong>2. Interview Documents Uploaded by Student:</strong>
                                <div className="mt-1 space-y-1">
                                  {application.documents
                                    .filter(doc => interviewDocuments.some(intDoc => intDoc.document_name === doc.document_type))
                                    .map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between p-1 bg-gray-50 rounded">
                                        <div className="flex-1">
                                          <span className="text-xs font-medium text-gray-900">{doc.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                          <p className="text-xs text-gray-500">{doc.original_filename} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                          <p className="text-xs text-gray-400">Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
                                        </div>
                                        <button
                                          onClick={() => window.open(`/admin/api/applications/${applicationId}/documents/${doc.id}/download`, '_blank')}
                                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center space-x-1"
                                        >
                                          <Download className="h-3 w-3" />
                                          <span>Download</span>
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Interview Request */}
                            {application.interview_requested_at && (
                              <div className="p-2 bg-white rounded border">
                                <p><strong>3. Interview Requested by Student:</strong> {new Date(application.interview_requested_at).toLocaleString()}</p>
                                <p><strong>Request Status:</strong> {application.interview_status || 'Pending Admin Response'}</p>
                              </div>
                            )}

                            {/* Interview Scheduling */}
                            {application.interview_scheduled_at && (
                              <div className="p-2 bg-white rounded border">
                                <p><strong>4. Interview Scheduled by Admin:</strong> {new Date(application.interview_scheduled_at).toLocaleString()}</p>
                                {application.interview_date && (
                                  <p><strong>Interview Date & Time:</strong> {new Date(application.interview_date).toLocaleString()}</p>
                                )}
                                {application.interview_location && (
                                  <p><strong>Location:</strong> {application.interview_location}</p>
                                )}
                                {application.interview_meeting_link && (
                                  <p><strong>Meeting Link:</strong> <a href={application.interview_meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{application.interview_meeting_link}</a></p>
                                )}
                                {application.interview_notes && (
                                  <div className="mt-2">
                                    <strong>Scheduling Notes:</strong>
                                    <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700 text-xs">
                                      {application.interview_notes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Interview Result */}
                            {application.interview_result && (
                              <div className={`p-2 rounded border ${
                                application.interview_result === 'pass' 
                                  ? 'bg-green-100 border-green-200' 
                                  : 'bg-red-100 border-red-200'
                              }`}>
                                <p><strong>5. Interview Result by Admin:</strong> <span className={`font-bold ${
                                  application.interview_result === 'pass' ? 'text-green-700' : 'text-red-700'
                                }`}>{application.interview_result.toUpperCase()}</span></p>
                                {application.interview_result_date && (
                                  <p><strong>Result Date:</strong> {new Date(application.interview_result_date).toLocaleString()}</p>
                                )}
                                {application.interview_result_notes && (
                                  <div className="mt-2">
                                    <strong>Result Notes:</strong>
                                    <div className="mt-1 p-2 bg-white rounded text-gray-700 text-xs">
                                      {application.interview_result_notes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {step.id === 'cas' && (application.cas_applied_at || application.cas_received_at) && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <h6 className="font-medium text-green-900 mb-2">CAS Application Process:</h6>
                          <div className="space-y-2 text-sm text-green-800">
                            {application.cas_applied_at && (
                              <div className="p-2 bg-white rounded border">
                                <p><strong>1. Student Applied for CAS:</strong> {new Date(application.cas_applied_at).toLocaleString()}</p>
                                <p><strong>Application Status:</strong> {application.cas_received_at ? 'CAS Document Provided by Admin' : 'Waiting for Admin to Upload CAS Document'}</p>
                              </div>
                            )}
                            
                            {application.cas_received_at && application.cas_original_filename && (
                              <div className="p-2 bg-white rounded border">
                                <p><strong>2. CAS Document Uploaded by Admin:</strong> {new Date(application.cas_received_at).toLocaleString()}</p>
                                <p><strong>File:</strong> {application.cas_original_filename}</p>
                                <p><strong>Size:</strong> {application.cas_size ? (application.cas_size / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <button
                                    onClick={handleDownloadCAS}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Download CAS Document</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Show CAS related documents if any */}
                            {application.documents && application.documents.filter(doc => 
                              doc.document_type === 'cas_document' || doc.document_type.toLowerCase().includes('cas')
                            ).length > 0 && (
                              <div className="p-2 bg-white rounded border">
                                <strong>CAS Related Documents:</strong>
                                <div className="mt-1 space-y-1">
                                  {application.documents
                                    .filter(doc => doc.document_type === 'cas_document' || doc.document_type.toLowerCase().includes('cas'))
                                    .map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between p-1 bg-gray-50 rounded">
                                        <div className="flex-1">
                                          <span className="text-xs font-medium text-gray-900">{doc.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                          <p className="text-xs text-gray-500">{doc.original_filename} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                          <p className="text-xs text-gray-400">Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
                                        </div>
                                        <button
                                          onClick={() => window.open(`/admin/api/applications/${applicationId}/documents/${doc.id}/download`, '_blank')}
                                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                                        >
                                          <Download className="h-3 w-3" />
                                          <span>Download</span>
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {isCurrent && (
                        <div className="mt-3 flex items-center space-x-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium">Action Required</span>
                        </div>
                      )}

                      {/* Step-specific Actions */}
                      {step.id === 'under_review' && (application.status === 'submitted' || application.status === 'under_review') && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <button
                            onClick={handleAcceptAndRequestOffer}
                            disabled={requestingOffer}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                          >
                            <Send className="h-4 w-4" />
                            <span>{requestingOffer ? 'Requesting…' : 'Accept & Request Offer'}</span>
                          </button>
                        </div>
                      )}

                      {step.id === 'offer_letter_requested' && application.status === 'offer_letter_requested' && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          {/* Email Draft Section */}
                          {application.offer_letter_email_draft && (
                            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-5 w-5 text-indigo-600" />
                                  <h6 className="font-medium text-indigo-900">Email Draft Generated</h6>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleShowEmailEditor}
                                    className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </div>
                              
                              <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto text-sm text-gray-700">
                                {application.offer_letter_email_draft.substring(0, 300)}
                                {application.offer_letter_email_draft.length > 300 && '...'}
                              </div>
                              
                              <div className="mt-2 flex items-center justify-between text-xs text-indigo-600">
                                <span>
                                  Generated: {application.offer_letter_email_generated_at ? 
                                    new Date(application.offer_letter_email_generated_at).toLocaleString() : 'Unknown'}
                                </span>
                                {application.offer_letter_email_edited_by_admin && (
                                  <span className="bg-indigo-100 px-2 py-1 rounded">Edited by Admin</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Show email error if any */}
                          {emailError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{emailError}</p>
                            </div>
                          )}

                          {/* Generate Email Button (if no draft exists) */}
                          {!application.offer_letter_email_draft && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700 mb-3">
                                Generate a professional email draft to request the offer letter from the university.
                              </p>
                              <button
                                onClick={handleShowEmailEditor}
                                disabled={isGeneratingEmail}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Mail className="h-4 w-4" />
                                <span>{isGeneratingEmail ? 'Generating...' : 'Generate Email Draft'}</span>
                              </button>
                            </div>
                          )}

                          <h5 className="font-medium text-purple-900 mb-3">Upload Offer Letter</h5>
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setOfferLetterFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                            <button
                              onClick={handleUploadOfferLetter}
                              disabled={!offerLetterFile || uploadProgress}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                              <Upload className="h-4 w-4" />
                              <span>{uploadProgress ? 'Uploading...' : 'Upload Offer Letter'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {step.id === 'offer_letter_received' && application.status === 'offer_letter_received' && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium text-green-900">Configure Interview Documents</h5>
                            <button
                              onClick={() => setShowInterviewConfig(!showInterviewConfig)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              {showInterviewConfig ? 'Cancel' : 'Configure'}
                            </button>
                          </div>

                          {showInterviewConfig && (
                            <div className="space-y-4 p-4 bg-white rounded-lg border">
                              <div>
                                <label className="text-sm font-medium text-blue-900 mb-2 block">
                                  Select Required Documents for Interview
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {Array.isArray(documentTypes) && documentTypes.length > 0 ? (
                                    documentTypes.map((docType) => (
                                      <label key={docType.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border hover:bg-gray-100">
                                        <input
                                          type="checkbox"
                                          checked={selectedDocumentTypes.includes(docType.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedDocumentTypes([...selectedDocumentTypes, docType.id]);
                                            } else {
                                              setSelectedDocumentTypes(selectedDocumentTypes.filter(id => id !== docType.id));
                                            }
                                          }}
                                          className="rounded text-blue-600"
                                        />
                                        <div className="flex-1">
                                          <span className="text-sm font-medium text-gray-900">{docType.name}</span>
                                          {docType.description && (
                                            <p className="text-xs text-gray-500">{docType.description}</p>
                                          )}
                                        </div>
                                      </label>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-center py-4 text-gray-500">
                                      {documentTypes.length === 0 ? 'No document types available' : 'Loading document types...'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-blue-900 mb-2 block">
                                  Additional Notes (Optional)
                                </label>
                                <textarea
                                  value={interviewNotes}
                                  onChange={(e) => setInterviewNotes(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={3}
                                  placeholder="Any additional instructions for the student..."
                                />
                              </div>
                              
                              <button
                                onClick={handleConfigureInterview}
                                disabled={selectedDocumentTypes.length === 0 || actionLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                <Send className="h-4 w-4" />
                                <span>{actionLoading ? 'Configuring...' : 'Configure Interview Documents'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {step.id === 'interview' && application.status === 'interview_documents_required' && interviewDocuments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-orange-200">
                          <h5 className="font-medium text-orange-900 mb-3">Interview Documents Status</h5>
                          <div className="space-y-2">
                            {interviewDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                <div>
                                  <span className="font-medium text-gray-900">{doc.document_name}</span>
                                  {doc.description && (
                                    <p className="text-sm text-gray-500">{doc.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {doc.is_uploaded ? (
                                    <div className="flex items-center space-x-1 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="text-sm font-medium">Uploaded</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 text-orange-600">
                                      <Clock className="h-4 w-4" />
                                      <span className="text-sm font-medium">Pending</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.id === 'interview' && application.status === 'interview_requested' && (
                        <div className="mt-4 pt-4 border-t border-indigo-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-indigo-900">Schedule Interview</h5>
                            <button
                              onClick={() => setShowInterviewScheduling(!showInterviewScheduling)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                            >
                              {showInterviewScheduling ? 'Cancel' : 'Schedule'}
                            </button>
                          </div>

                          {showInterviewScheduling && (
                            <div className="space-y-4 p-4 bg-white rounded-lg border">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Interview Date & Time *
                                </label>
                                <input
                                  type="datetime-local"
                                  value={interviewDate}
                                  onChange={(e) => setInterviewDate(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Location (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={interviewLocation}
                                  onChange={(e) => setInterviewLocation(e.target.value)}
                                  placeholder="e.g., Room 101, Building A or Online"
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Meeting Link (Optional)
                                </label>
                                <input
                                  type="url"
                                  value={interviewMeetingLink}
                                  onChange={(e) => setInterviewMeetingLink(e.target.value)}
                                  placeholder="https://zoom.us/j/..."
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Additional Notes (Optional)
                                </label>
                                <textarea
                                  value={interviewScheduleNotes}
                                  onChange={(e) => setInterviewScheduleNotes(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  rows={3}
                                  placeholder="Any additional instructions for the student..."
                                />
                              </div>

                              <button
                                onClick={handleScheduleInterview}
                                disabled={!interviewDate || actionLoading}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                <Calendar className="h-4 w-4" />
                                <span>{actionLoading ? 'Scheduling...' : 'Schedule Interview'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {step.id === 'interview' && application.status === 'interview_scheduled' && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-blue-900">Interview Details</h5>
                            <button
                              onClick={() => setShowInterviewResult(!showInterviewResult)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              {showInterviewResult ? 'Cancel' : 'Mark Result'}
                            </button>
                          </div>

                          <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                            {application.interview_date && (
                              <p className="text-sm text-blue-700 mb-1">
                                <strong>Date & Time:</strong> {new Date(application.interview_date).toLocaleDateString()} at {new Date(application.interview_date).toLocaleTimeString()}
                              </p>
                            )}
                            {application.interview_location && (
                              <p className="text-sm text-blue-700 mb-1">
                                <strong>Location:</strong> {application.interview_location}
                              </p>
                            )}
                            {application.interview_meeting_link && (
                              <p className="text-sm text-blue-700 mb-1">
                                <strong>Meeting Link:</strong> <a href={application.interview_meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{application.interview_meeting_link}</a>
                              </p>
                            )}
                            {application.interview_notes && (
                              <p className="text-sm text-blue-700">
                                <strong>Notes:</strong> {application.interview_notes}
                              </p>
                            )}
                          </div>

                          {showInterviewResult && (
                            <div className="space-y-4 p-4 bg-white rounded-lg border">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Interview Result *
                                </label>
                                <div className="flex space-x-4">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      value="pass"
                                      checked={interviewResult === 'pass'}
                                      onChange={(e) => setInterviewResult(e.target.value as 'pass' | 'fail')}
                                      className="text-green-600"
                                    />
                                    <span className="text-green-700 font-medium">Pass</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      value="fail"
                                      checked={interviewResult === 'fail'}
                                      onChange={(e) => setInterviewResult(e.target.value as 'pass' | 'fail')}
                                      className="text-red-600"
                                    />
                                    <span className="text-red-700 font-medium">Fail</span>
                                  </label>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Result Notes (Optional)
                                </label>
                                <textarea
                                  value={interviewResultNotes}
                                  onChange={(e) => setInterviewResultNotes(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={3}
                                  placeholder="Additional feedback or notes about the interview result..."
                                />
                              </div>

                              <button
                                onClick={handleMarkInterviewResult}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                                  interviewResult === 'pass' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>{actionLoading ? 'Saving...' : `Mark as ${interviewResult === 'pass' ? 'Passed' : 'Failed'}`}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {step.id === 'interview' && application.interview_result && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className={`p-3 rounded-lg ${
                            application.interview_result === 'pass' 
                              ? 'bg-green-100 border border-green-200' 
                              : 'bg-red-100 border border-red-200'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className={`h-4 w-4 ${
                                application.interview_result === 'pass' ? 'text-green-600' : 'text-red-600'
                              }`} />
                              <span className={`font-medium ${
                                application.interview_result === 'pass' ? 'text-green-900' : 'text-red-900'
                              }`}>
                                Interview {application.interview_result === 'pass' ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            
                            {application.interview_result_date && (
                              <p className={`text-sm mb-1 ${
                                application.interview_result === 'pass' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <strong>Result Date:</strong> {new Date(application.interview_result_date).toLocaleDateString()}
                              </p>
                            )}
                            
                            {application.interview_result_notes && (
                              <p className={`text-sm ${
                                application.interview_result === 'pass' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <strong>Notes:</strong> {application.interview_result_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {step.id === 'cas' && application.status === 'accepted' && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          {!application.cas_applied_at && (
                            <div className="p-3 bg-green-100 rounded-lg">
                              <p className="text-sm text-green-800">
                                <strong>Status:</strong> Waiting for student to apply for CAS.
                              </p>
                            </div>
                          )}

                          {application.cas_applied_at && !application.cas_received_at && (
                            <div>
                              <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  <strong>CAS Applied:</strong> {new Date(application.cas_applied_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                  Student has applied for CAS. Please upload the CAS document when available.
                                </p>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-green-900 mb-2">
                                    Upload CAS Document
                                  </label>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setCasFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                  />
                                </div>
                                
                                <button
                                  onClick={handleUploadCAS}
                                  disabled={!casFile || uploadingCAS}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>{uploadingCAS ? 'Uploading...' : 'Upload CAS'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {application.cas_received_at && application.cas_original_filename && (
                            <div className="p-3 bg-green-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-green-800 font-medium">
                                    ✅ CAS Document Uploaded
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Uploaded on: {new Date(application.cas_received_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    File: {application.cas_original_filename}
                                  </p>
                                </div>
                                <button
                                  onClick={handleDownloadCAS}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Visa Step UI */}
                      {step.id === 'visa' && application.visa_application_enabled_at && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          {/* Configure Visa Documents */}
                          {!application.visa_documents_configured_at && (
                            <div className="p-3 bg-blue-100 rounded-lg mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-blue-900">Configure Visa Documents</h6>
                                <button
                                  onClick={() => setShowVisaConfig(!showVisaConfig)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                                >
                                  <Settings className="h-3 w-3" />
                                  <span>Configure Documents</span>
                                </button>
                              </div>
                              
                              {showVisaConfig && (
                                <div className="mt-3 p-3 bg-white rounded border">
                                  <h6 className="font-medium text-blue-900 mb-2">Select Required Visa Documents:</h6>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                    {documentTypes.map((docType) => (
                                      <label key={docType.id} className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedVisaDocumentTypes.includes(docType.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedVisaDocumentTypes([...selectedVisaDocumentTypes, docType.id]);
                                            } else {
                                              setSelectedVisaDocumentTypes(selectedVisaDocumentTypes.filter(id => id !== docType.id));
                                            }
                                          }}
                                          className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-blue-800 font-medium">{docType.name}</span>
                                        {docType.description && (
                                          <span className="text-xs text-blue-600">({docType.description})</span>
                                        )}
                                      </label>
                                    ))}
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label className="block text-sm font-medium text-blue-900 mb-1">
                                      Configuration Notes (Optional):
                                    </label>
                                    <textarea
                                      value={visaNotes}
                                      onChange={(e) => setVisaNotes(e.target.value)}
                                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows={2}
                                      placeholder="Add any notes about visa document requirements..."
                                    />
                                  </div>
                                  
                                  <button
                                    onClick={handleConfigureVisa}
                                    disabled={selectedVisaDocumentTypes.length === 0 || actionLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                    <Send className="h-4 w-4" />
                                    <span>{actionLoading ? 'Configuring...' : 'Configure Visa Documents'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Visa Application Status */}
                          {application.visa_applied_at && !application.visa_received_at && (
                            <div className="p-3 bg-yellow-100 rounded-lg mb-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                ⏳ Student Applied for Visa
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Applied on: {new Date(application.visa_applied_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-yellow-700 mt-2">
                                <strong>Next Step:</strong> Process visa application manually and upload visa document when ready.
                              </p>
                              
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-yellow-800 mb-2">
                                  Upload Visa Document:
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => setVisaFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                </div>
                                
                                <button
                                  onClick={handleUploadVisa}
                                  disabled={!visaFile || uploadingVisa}
                                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>{uploadingVisa ? 'Uploading...' : 'Upload Visa'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Visa Document Uploaded */}
                          {application.visa_received_at && application.visa_original_filename && (
                            <div className="p-3 bg-green-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-green-800 font-medium">
                                    ✅ Visa Document Uploaded - Application Completed!
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Uploaded on: {new Date(application.visa_received_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    File: {application.visa_original_filename}
                                  </p>
                                  <p className="text-xs text-green-600 mt-2 font-medium">
                                    🎉 Student application journey is now complete!
                                  </p>
                                </div>
                                <button
                                  onClick={handleDownloadVisa}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Student Information</span>
          </h3>
          
          <div className="space-y-3">
            {application.student ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{application.student.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{application.student.email}</p>
                </div>
                {application.student.phone_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{application.student.phone_number}</p>
                  </div>
                )}
                {application.student.country_of_origin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-gray-900">{application.student.country_of_origin}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 italic">No student information available</div>
            )}
          </div>
        </div>

        {/* Program Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Program Information</span>
          </h3>
          
          <div className="space-y-3">
            {application.program ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">University</label>
                  <p className="text-gray-900">{application.program.university_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Program</label>
                  <p className="text-gray-900">{application.program.program_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Level</label>
                  <p className="text-gray-900">{application.program.program_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{application.program.city}</p>
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">No program information available</div>
            )}
          </div>
        </div>
      </div>

      {/* Email Editor Modal */}
      <OfferLetterEmailEditor
        isOpen={showEmailEditor}
        onClose={handleCloseEmailEditor}
        applicationId={applicationId}
        initialEmailDraft={application?.offer_letter_email_draft || ''}
        onSave={handleSaveEmail}
        onGenerate={handleGenerateEmail}
        isGenerating={isGeneratingEmail}
        isSaving={isSavingEmail}
        saveButtonLabel="Save & Mark Requested"
      />

    </div>
  );
}
