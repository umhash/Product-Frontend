'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  XCircle,
  Brain,
  GraduationCap,
  FileText,
  TrendingUp,
  Calendar,
  Target,
  Award,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { Navigation } from '@/components';
import api from '@/lib/api';

interface UserInfo {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
}

interface EligibilityResult {
  status: 'eligible' | 'at_risk' | 'not_eligible';
  score: number;
  assessment_date: string;
  suggested_programs: any[];
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Get user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Fetch latest eligibility result
    fetchEligibilityResult();
  }, [router]);

  const fetchEligibilityResult = async () => {
    try {
      const response = await api.get('/eligibility/result');
      setEligibilityResult(response.data);
    } catch (error) {
      // No eligibility result yet - that's okay
      console.log('No eligibility result found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'eligible':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Eligible for UK Study',
          description: 'Great news! You meet the requirements for UK university admission.'
        };
      case 'at_risk':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'At Risk - Action Needed',
          description: 'You\'re close to meeting requirements. Some improvements needed.'
        };
      case 'not_eligible':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Not Currently Eligible',
          description: 'Don\'t worry! We\'ll help you understand what needs improvement.'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Assessment Pending',
          description: 'Complete your eligibility assessment to see your status.'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="dashboard" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = eligibilityResult ? getStatusConfig(eligibilityResult.status) : getStatusConfig('pending');
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.full_name?.split(' ')[0]}! 
          </h1>
          <p className="text-slate-600 mt-2">Your personalized dashboard for UK university success</p>
        </div>

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Eligibility Status Card */}
          <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-2xl p-6 lg:col-span-2`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`${statusConfig.color} bg-white p-3 rounded-full`}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{statusConfig.title}</h2>
                  <p className="text-gray-600">{statusConfig.description}</p>
                </div>
              </div>
              {eligibilityResult && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{Math.round(eligibilityResult.score)}%</div>
                  <div className="text-sm text-gray-600">Eligibility Score</div>
                </div>
              )}
            </div>
            
            {eligibilityResult && (
              <div className="mb-4">
                <div className="w-full bg-white rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      eligibilityResult.status === 'eligible' ? 'bg-green-500' :
                      eligibilityResult.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${eligibilityResult.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Last assessed: {new Date(eligibilityResult.assessment_date).toLocaleDateString()}</span>
                  <span>{eligibilityResult.suggested_programs.length} programs recommended</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {eligibilityResult ? (
                <>
                  <button
                    onClick={() => router.push('/eligibility/result')}
                    className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>View Results</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push('/eligibility')}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Retake Assessment</span>
                    <Brain className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/eligibility')}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applications Ready</p>
                  <p className="text-xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Strength</p>
                  <p className="text-xl font-bold text-gray-900">
                    {eligibilityResult ? `${Math.round(eligibilityResult.score)}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Study Assistant</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Get personalized guidance on university selection, application strategies, and visa requirements.
            </p>
            <button
              onClick={() => router.push('/chat')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Start Chatting</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Eligibility Checker</h3>
            </div>
            <p className="text-slate-600 mb-4">
              {eligibilityResult 
                ? 'Update your assessment with new information or retake to improve your score.'
                : 'Discover which UK universities you can apply to based on your profile.'
              }
            </p>
            <button
              onClick={() => router.push('/eligibility')}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>{eligibilityResult ? 'Update Assessment' : 'Start Assessment'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Document Manager</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Upload and organize your academic documents, transcripts, and certificates for your applications.
            </p>
            <button 
              onClick={() => router.push('/documents')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Manage Documents</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Second Row of Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Admission Applications</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Manage your university applications, track progress, and submit required documents.
            </p>
            <button 
              onClick={() => router.push('/applications')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>View Applications</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <span>Recent Activity</span>
            </h3>
          </div>
          <div className="p-6">
            {eligibilityResult ? (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Brain className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Eligibility Assessment Completed</p>
                  <p className="text-sm text-gray-600">
                    Score: {Math.round(eligibilityResult.score)}% • {eligibilityResult.suggested_programs.length} programs recommended
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(eligibilityResult.assessment_date).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Complete your first eligibility assessment to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}