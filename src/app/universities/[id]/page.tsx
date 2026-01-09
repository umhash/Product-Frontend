'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Clock, 
  BookOpen,
  Download,
  FileText,
  CheckCircle,
  Calendar,
  Users,
  Star,
  ArrowLeft,
  Send
} from 'lucide-react';
import { universitiesApi, applicationsApi } from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface ProgramDocument {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

interface UniversityDetails {
  id: number;
  university_name: string;
  program_name: string;
  program_level: string;
  field_of_study: string;
  min_ielts_overall?: number;
  min_ielts_components?: number;
  min_toefl_overall?: number;
  min_pte_overall?: number;
  duolingo_min_score?: number;
  min_gpa_4_scale?: number;
  min_percentage?: number;
  required_qualification?: string;
  tuition_fee_min_gbp?: number;
  tuition_fee_max_gbp?: number;
  tuition_fee_gbp?: number;
  living_cost_gbp?: number;
  duration_months?: number;
  intake_months?: number[];
  city: string;
  program_description?: string;
  programs_available?: string;
  ug_entry_requirements?: string;
  pg_entry_requirements?: string;
  english_requirements_text?: string;
  moi_accepted?: string;
  initial_deposit_gbp?: number;
  scholarships?: string;
  study_gap_acceptable?: string;
  special_notes?: string;
  entry_requirements_text?: string;
  is_active: boolean;
  created_at: string;
  documents: ProgramDocument[];
}

export default function UniversityDetails() {
  const [university, setUniversity] = useState<UniversityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingDoc, setDownloadingDoc] = useState<number | null>(null);
  const router = useRouter();
  const params = useParams();
  const universityId = params.id as string;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    if (universityId) {
      fetchUniversityDetails();
    }
  }, [universityId, router]);

  const fetchUniversityDetails = async () => {
    try {
      const data = await universitiesApi.getUniversityDetails(parseInt(universityId));
      setUniversity(data);
    } catch (error: any) {
      console.error('Failed to fetch university details:', error);
      setError(error.response?.data?.detail || 'Failed to load university details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId: number, filename: string) => {
    setDownloadingDoc(documentId);
    try {
      const response = await universitiesApi.downloadDocument(documentId);
      
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
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloadingDoc(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatIntakeMonths = (months?: number[]) => {
    if (!months || months.length === 0) return 'Not specified';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(m => monthNames[m - 1]).join(', ');
  };

  const handleApplyForAdmission = async () => {
    try {
      const application = await applicationsApi.createApplication(university.id);
      router.push(`/applications/${application.id}`);
    } catch (error: any) {
      console.error('Failed to create application:', error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already have an application')) {
        alert('You already have an application for this program. Please check your applications page.');
        router.push('/applications');
      } else {
        alert(error.response?.data?.detail || 'Failed to create application. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <GraduationCap className="h-5 w-5 animate-pulse" />
            <span className="text-lg font-medium">Loading university details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">University Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!university) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation currentPage="universities" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Eligibility Results', href: '/eligibility/result' },
          { label: university.university_name }
        ]} />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Results</span>
        </button>
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{university.program_name}</h1>
              <p className="text-2xl text-indigo-100 mb-4">{university.university_name}</p>
              <div className="flex items-center space-x-6 text-indigo-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{university.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{university.program_level}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{university.field_of_study}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-3xl font-bold">
                  {university.tuition_fee_min_gbp && university.tuition_fee_max_gbp 
                    ? `£${university.tuition_fee_min_gbp.toLocaleString()} - £${university.tuition_fee_max_gbp.toLocaleString()}`
                    : university.tuition_fee_gbp 
                    ? `£${university.tuition_fee_gbp.toLocaleString()}`
                    : 'TBD'}
                </div>
                <div className="text-sm">per year</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Program Description */}
            {university.program_description && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  <span>About This Program</span>
                </h2>
                <p className="text-gray-700 leading-relaxed">{university.program_description}</p>
              </div>
            )}

            {/* Entry Requirements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Entry Requirements</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Qualifications</h3>
                  <div className="space-y-3">
                    {university.entry_requirements_text && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{university.entry_requirements_text}</p>
                      </div>
                    )}
                    {university.min_gpa_4_scale && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-gray-700">Minimum GPA: {university.min_gpa_4_scale}/4.0</span>
                      </div>
                    )}
                    {university.min_percentage && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-gray-700">Minimum Score: {university.min_percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">English Language</h3>
                  <div className="space-y-3">
                    {university.english_requirements_text && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700">{university.english_requirements_text}</p>
                      </div>
                    )}
                    {university.min_ielts_overall && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">
                          IELTS: {university.min_ielts_overall} overall
                          {university.min_ielts_components && ` (${university.min_ielts_components} each)`}
                        </span>
                      </div>
                    )}
                    {university.min_toefl_overall && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">TOEFL: {university.min_toefl_overall}</span>
                      </div>
                    )}
                    {university.min_pte_overall && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">PTE: {university.min_pte_overall}</span>
                      </div>
                    )}
                    {university.duolingo_min_score && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Duolingo: {university.duolingo_min_score}</span>
                      </div>
                    )}
                    {university.moi_accepted && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900"><strong>MOI:</strong> {university.moi_accepted}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(university.scholarships || university.initial_deposit_gbp || university.study_gap_acceptable) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-3">
                    {university.initial_deposit_gbp && (
                      <div className="flex items-start space-x-3">
                        <DollarSign className="h-5 w-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Initial Deposit</p>
                          <p className="text-sm text-gray-700">£{university.initial_deposit_gbp.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {university.scholarships && (
                      <div className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Scholarships Available</p>
                          <p className="text-sm text-gray-700">{university.scholarships}</p>
                        </div>
                      </div>
                    )}
                    {university.study_gap_acceptable && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Study Gap</p>
                          <p className="text-sm text-gray-700">{university.study_gap_acceptable}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {university.special_notes && (
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-900"><strong>Important:</strong> {university.special_notes}</p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            {university.documents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span>Program Documents</span>
                </h2>
                
                <div className="grid gap-4">
                  {university.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.original_filename}</h4>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.file_size)} • PDF • 
                            Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDownloadDocument(doc.id, doc.original_filename)}
                        disabled={downloadingDoc === doc.id}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {downloadingDoc === doc.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Facts */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Facts</h3>
              <div className="space-y-4">
                {university.duration_months && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold">{university.duration_months} months</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Intake</span>
                  <span className="font-semibold">{formatIntakeMonths(university.intake_months)}</span>
                </div>
                
                {university.living_cost_gbp && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Living Cost</span>
                    <span className="font-semibold">£{university.living_cost_gbp.toLocaleString()}/year</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-gray-600 font-medium">Total Cost</span>
                  <span className="font-bold text-lg">
                    £{((university.tuition_fee_gbp || 0) + (university.living_cost_gbp || 0)).toLocaleString()}/year
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Have questions about this program? Our education consultants are here to help.
              </p>
              <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Contact Consultant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Apply?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Take the next step towards your UK education journey
            </p>
            <button
              onClick={handleApplyForAdmission}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold mx-auto"
            >
              <Send className="h-6 w-6" />
              <span>Apply for Admission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
