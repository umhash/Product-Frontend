'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Brain,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Download,
  Share2,
  Star
} from 'lucide-react';
import api from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface AssessmentReason {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  explanation: string;
  citation?: string;
}

interface SuggestedProgram {
  id: number;
  university_name: string;
  program_name: string;
  program_level: string;
  field_of_study: string;
  city: string;
  tuition_fee_gbp?: number;
  match_score: number;
  tags: string[];
  reasons: string[];
}

interface EligibilityResult {
  status: 'eligible' | 'at_risk' | 'not_eligible';
  score: number;
  reasons: AssessmentReason[];
  suggested_programs: SuggestedProgram[];
  assessment_date: string;
}

export default function EligibilityResult() {
  const [result, setResult] = useState<EligibilityResult | null>(null);
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

    fetchResult();
  }, [router]);

  const fetchResult = async () => {
    try {
      const response = await api.get('/eligibility/result');
      setResult(response.data);
    } catch (error: any) {
      console.error('Failed to fetch result:', error);
      setError(error.response?.data?.detail || 'Failed to load results');
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
          subtitle: 'Great news! You meet the requirements for UK university admission.'
        };
      case 'at_risk':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'At Risk - Action Needed',
          subtitle: 'You\'re close to meeting requirements. Some improvements needed.'
        };
      case 'not_eligible':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Not Currently Eligible',
          subtitle: 'Don\'t worry! We\'ll help you understand what needs improvement.'
        };
      default:
        return {
          icon: Brain,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Assessment Complete',
          subtitle: 'Your eligibility assessment has been processed.'
        };
    }
  };

  const getReasonStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="text-lg font-medium">AI is analyzing your profile...</span>
          </div>
          <p className="text-gray-600 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Results</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/eligibility')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const statusConfig = getStatusConfig(result.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation currentPage="eligibility" />
      
      {/* Remove duplicate page header; keep content sections below */}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Eligibility Assessment', href: '/eligibility' },
          { label: 'Results' }
        ]} />
        
        {/* Main Status Card */}
        <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-2xl p-8 mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`${statusConfig.color} bg-white p-3 rounded-full`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{statusConfig.title}</h2>
                <p className="text-lg text-gray-600">{statusConfig.subtitle}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">{Math.round(result.score)}%</div>
              <div className="text-sm text-gray-600">Eligibility Score</div>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="w-full bg-white rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                result.status === 'eligible' ? 'bg-green-500' :
                result.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.score}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Assessment completed on {new Date(result.assessment_date).toLocaleDateString()}</span>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Assessment Breakdown - Horizontal Cards */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <span>Your Eligibility Breakdown</span>
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.reasons.map((reason, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                reason.status === 'pass' ? 'border-green-500' :
                reason.status === 'warning' ? 'border-yellow-500' : 'border-red-500'
              }`}>
                <div className="flex items-start space-x-3 mb-3">
                  {getReasonStatusIcon(reason.status)}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{reason.category}</h4>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                      reason.status === 'pass' ? 'bg-green-100 text-green-800' :
                      reason.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reason.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-2">{reason.message}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{reason.explanation}</p>
                {reason.citation && (
                  <p className="text-xs text-gray-500 mt-3 italic border-t pt-2">
                    💡 {reason.citation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Universities - Enhanced Cards */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            <span>Your Top 4 University Matches</span>
          </h3>
          
          {result.suggested_programs.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {result.suggested_programs.map((program, index) => (
                <div key={program.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                  {/* Header with Match Score */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">#{index + 1} Match</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{Math.round(program.match_score)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">{program.program_name}</h4>
                      <p className="text-lg text-indigo-600 font-semibold">{program.university_name}</p>
                    </div>

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{program.city}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{program.program_level}</span>
                      </div>
                      {program.tuition_fee_gbp && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">£{program.tuition_fee_gbp.toLocaleString()}/year</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{program.field_of_study}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {program.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {program.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className={`text-xs px-3 py-1 rounded-full font-medium ${
                            tag.includes('Meets') || tag.includes('Affordable') || tag.includes('Preferred') ? 'bg-green-100 text-green-800' :
                            tag.includes('Gap') || tag.includes('Missing') || tag.includes('Tight') ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Why This Program */}
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2 flex items-center space-x-1">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span>Why this is perfect for you:</span>
                      </h5>
                      <ul className="space-y-2">
                        {program.reasons.slice(0, 3).map((reason, reasonIndex) => (
                          <li key={reasonIndex} className="text-sm text-gray-700 flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => router.push(`/universities/${program.id}`)}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">No Program Matches Found</h4>
              <p className="text-gray-600 mb-4">Don't worry! Let's improve your profile to find better matches.</p>
              <button 
                onClick={() => router.push('/eligibility')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retake Assessment
              </button>
            </div>
          )}
        </div>

        {/* Decision Support & Next Steps */}
        <div className="mt-8 space-y-6">
          {/* Quick Decision Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Brain className="h-6 w-6 text-indigo-600" />
              <span>How to Choose Your University</span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-semibold text-gray-900">Match Score</h4>
                </div>
                <p className="text-sm text-gray-600">Higher match scores indicate better alignment with your profile and goals.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold text-gray-900">Total Cost</h4>
                </div>
                <p className="text-sm text-gray-600">Consider tuition + living costs. London is more expensive than other cities.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold text-gray-900">Location</h4>
                </div>
                <p className="text-sm text-gray-600">Think about lifestyle, weather, job opportunities, and distance from home.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  <h4 className="font-semibold text-gray-900">Reputation</h4>
                </div>
                <p className="text-sm text-gray-600">University ranking matters for career prospects and global recognition.</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Action Plan</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Research Programs</h4>
                <p className="text-sm text-gray-600 mb-3">Visit university websites, read course details, and check entry requirements</p>
                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                  Start Research →
                </button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Prepare Documents</h4>
                <p className="text-sm text-gray-600 mb-3">Gather transcripts, references, and improve English test scores if needed</p>
                <button className="text-green-600 text-sm font-medium hover:text-green-700">
                  Document Checklist →
                </button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Statement Writer</h4>
                <p className="text-sm text-gray-600 mb-3">Create compelling personal statements tailored to each university</p>
                <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                  Generate Statement →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
