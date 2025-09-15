'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  MapPin, 
  Clock, 
  FileText,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface Application {
  id: number;
  student_id: number;
  program_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  documents: any[];
  program: {
    id: number;
    university_name: string;
    program_name: string;
    program_level: string;
    city: string;
    field_of_study: string;
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchApplications();
  }, [router]);

  const fetchApplications = async () => {
    try {
      const response = await applicationsApi.getMyApplications();
      setApplications(response.applications);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      setError(error.response?.data?.detail || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Submitted'
        };
      case 'under_review':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Under Review'
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
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Rejected'
        };
      case 'draft':
      default:
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Draft'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navigation currentPage="applications" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <GraduationCap className="h-5 w-5 animate-pulse" />
              <span className="text-lg font-medium">Loading your applications...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation currentPage="applications" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Applications' }
        ]} />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-purple-600" />
              <span>My Applications</span>
            </h1>
            <p className="text-gray-600 mt-2">Manage your university applications and track their progress</p>
          </div>
          
          <button
            onClick={() => router.push('/eligibility/result')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Application</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="grid gap-6">
            {applications.map((application) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={application.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{application.program.program_name}</h3>
                        <p className="text-purple-100 text-lg">{application.program.university_name}</p>
                      </div>
                      
                      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border px-3 py-1 rounded-full flex items-center space-x-2`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        <span className={`text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{application.program.city}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{application.program.program_level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{application.documents.length} documents</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Created: {new Date(application.created_at).toLocaleDateString()}</p>
                        {application.submitted_at && (
                          <p>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        {application.status === 'draft' && (
                          <button
                            onClick={() => router.push(`/applications/${application.id}`)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                          >
                            <span>Continue</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/applications/${application.id}/status`)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          View Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <GraduationCap className="h-24 w-24 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Applications Yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start by completing your eligibility assessment to discover which universities you can apply to.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/eligibility')}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
                >
                  <span>Take Eligibility Test</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-sm text-gray-500">
                  Already completed? <button 
                    onClick={() => router.push('/eligibility/result')} 
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    View your results
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
