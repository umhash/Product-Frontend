'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Brain,
  Sparkles,
  User,
  GraduationCap,
  Globe,
  DollarSign,
  Target
} from 'lucide-react';
import api from '@/lib/api';
import { Navigation, Breadcrumb } from '@/components';

interface StepData {
  [key: string]: any;
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Basic information about you' },
  { id: 2, title: 'Education', icon: GraduationCap, description: 'Your academic background' },
  { id: 3, title: 'English Proficiency', icon: Globe, description: 'Language test scores' },
  { id: 4, title: 'Financials', icon: DollarSign, description: 'Funding and budget details' },
  { id: 5, title: 'Preferences', icon: Target, description: 'Study preferences and goals' }
];

export default function EligibilityChecker() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Start or resume assessment
    startAssessment();
  }, [router]);

  const startAssessment = async () => {
    try {
      const response = await api.post('/eligibility/start');
      setAssessmentId(response.data.id);
      setCurrentStep(response.data.current_step);
      
      // Load existing data if resuming
      if (response.data.personal_info) {
        setStepData(prev => ({ ...prev, ...response.data.personal_info }));
      }
      if (response.data.education) {
        setStepData(prev => ({ ...prev, ...response.data.education }));
      }
      if (response.data.english_proficiency) {
        setStepData(prev => ({ ...prev, ...response.data.english_proficiency }));
      }
      if (response.data.financials) {
        setStepData(prev => ({ ...prev, ...response.data.financials }));
      }
      if (response.data.preferences) {
        setStepData(prev => ({ ...prev, ...response.data.preferences }));
      }
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  };

  const updateStepData = (data: StepData) => {
    setStepData(prev => ({ ...prev, ...data }));
  };

  const saveProgress = async (data: StepData) => {
    if (!assessmentId) return;

    try {
      await api.put('/eligibility/update', {
        current_step: currentStep,
        ...data
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep < 5) {
      await saveProgress(stepData);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    setIsSubmitting(true);
    try {
      await saveProgress(stepData);
      await api.post('/eligibility/submit');
      router.push('/eligibility/result');
    } catch (error: any) {
      console.error('Failed to submit assessment:', error);
      alert(error.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep data={stepData} onUpdate={updateStepData} />;
      case 2:
        return <EducationStep data={stepData} onUpdate={updateStepData} />;
      case 3:
        return <EnglishProficiencyStep data={stepData} onUpdate={updateStepData} />;
      case 4:
        return <FinancialsStep data={stepData} onUpdate={updateStepData} />;
      case 5:
        return <PreferencesStep data={stepData} onUpdate={updateStepData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Navigation currentPage="eligibility" />
      
      {/* Single page header removed; Navigation already provides top header */}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Eligibility Assessment' }]} />
        
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Step Circles */}
            <div className="relative flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-300 shadow-lg ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white transform scale-105' 
                        : isCurrent 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600 text-white transform scale-110 shadow-xl' 
                          : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                      
                      {/* Pulse animation for current step */}
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse opacity-30"></div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-center">
                      <div className={`text-sm font-semibold ${
                        isCurrent ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 max-w-20">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-3 bg-white rounded-2xl px-6 py-3 shadow-sm border border-slate-200">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {STEPS[currentStep - 1]?.title}
                </h2>
                <p className="text-sm text-slate-600">{STEPS[currentStep - 1]?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200 p-10 mb-10">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-3 px-6 py-3 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-slate-50 rounded-xl"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-semibold">Previous</span>
          </button>

          <div className="flex items-center space-x-3 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <Clock className="h-4 w-4" />
              <span>Auto-saved</span>
            </div>
            <span>•</span>
            <span>Step {currentStep} of {STEPS.length}</span>
          </div>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Continue</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing your profile...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Get My Results</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function PersonalInfoStep({ data, onUpdate }: { data: StepData; onUpdate: (data: StepData) => void }) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full border border-indigo-200">
          <User className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">Personal Information</span>
        </div>
        <p className="text-slate-600 mt-2">Let's start with your basic details</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Full Name</label>
          <input
            type="text"
            value={data.full_name || ''}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder-slate-500"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Date of Birth</label>
          <input
            type="date"
            value={data.date_of_birth || ''}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Nationality</label>
          <input
            type="text"
            value={data.nationality || ''}
            onChange={(e) => handleChange('nationality', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder-slate-500"
            placeholder="e.g., Pakistani, Indian, Nigerian"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Passport Validity</label>
          <input
            type="date"
            value={data.passport_validity || ''}
            onChange={(e) => handleChange('passport_validity', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">City</label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder-slate-500"
            placeholder="Current city"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Country</label>
          <input
            type="text"
            value={data.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder-slate-500"
            placeholder="Current country"
          />
        </div>
      </div>
    </div>
  );
}

function EducationStep({ data, onUpdate }: { data: StepData; onUpdate: (data: StepData) => void }) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Highest Qualification</label>
          <select
            value={data.highest_qualification || ''}
            onChange={(e) => handleChange('highest_qualification', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select qualification</option>
            <option value="high_school">High School</option>
            <option value="diploma">Diploma</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="phd">PhD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade System</label>
          <select
            value={data.grade_system || ''}
            onChange={(e) => handleChange('grade_system', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select system</option>
            <option value="4.0">GPA (4.0 scale)</option>
            <option value="10.0">GPA (10.0 scale)</option>
            <option value="percentage">Percentage</option>
            <option value="uk_classification">UK Classification</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GPA/Grade Score</label>
          <input
            type="number"
            step="0.01"
            value={data.gpa_score || ''}
            onChange={(e) => handleChange('gpa_score', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 3.5, 85, 75%"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
          <input
            type="number"
            value={data.graduation_year || ''}
            onChange={(e) => handleChange('graduation_year', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 2023"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discipline / Field</label>
          <input
            type="text"
            value={data.discipline || ''}
            onChange={(e) => handleChange('discipline', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Computer Science, Business Administration"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medium of Instruction</label>
          <select
            value={data.medium_of_instruction || ''}
            onChange={(e) => handleChange('medium_of_instruction', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select medium</option>
            <option value="english">English</option>
            <option value="local">Local Language</option>
            <option value="mixed">Mixed (English + Local)</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notable Coursework (Optional)</label>
        <textarea
          value={data.notable_coursework || ''}
          onChange={(e) => handleChange('notable_coursework', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Any relevant courses, projects, or achievements..."
        />
      </div>
    </div>
  );
}

function EnglishProficiencyStep({ data, onUpdate }: { data: StepData; onUpdate: (data: StepData) => void }) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const showScoreFields = data.english_test_type && data.english_test_type !== 'not_taken';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">English Test Type</label>
        <select
          value={data.english_test_type || ''}
          onChange={(e) => handleChange('english_test_type', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select test type</option>
          <option value="ielts">IELTS</option>
          <option value="toefl">TOEFL</option>
          <option value="pte">PTE</option>
          <option value="duolingo">Duolingo</option>
          <option value="selt">SELT</option>
          <option value="not_taken">Not taken yet</option>
        </select>
      </div>

      {showScoreFields && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Score</label>
            <input
              type="number"
              step="0.1"
              value={data.english_overall_score || ''}
              onChange={(e) => handleChange('english_overall_score', parseFloat(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Overall band/score"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Listening Score</label>
            <input
              type="number"
              step="0.1"
              value={data.english_listening || ''}
              onChange={(e) => handleChange('english_listening', parseFloat(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Listening score"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reading Score</label>
            <input
              type="number"
              step="0.1"
              value={data.english_reading || ''}
              onChange={(e) => handleChange('english_reading', parseFloat(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Reading score"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Writing Score</label>
            <input
              type="number"
              step="0.1"
              value={data.english_writing || ''}
              onChange={(e) => handleChange('english_writing', parseFloat(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Writing score"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Speaking Score</label>
            <input
              type="number"
              step="0.1"
              value={data.english_speaking || ''}
              onChange={(e) => handleChange('english_speaking', parseFloat(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Speaking score"
            />
          </div>
        </div>
      )}

      {data.english_test_type === 'not_taken' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> You'll need to take an English proficiency test (IELTS, TOEFL, or PTE) for UK university admission. 
            We'll provide guidance on required scores based on your program preferences.
          </p>
        </div>
      )}
    </div>
  );
}

function FinancialsStep({ data, onUpdate }: { data: StepData; onUpdate: (data: StepData) => void }) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
          <select
            value={data.funding_source || ''}
            onChange={(e) => handleChange('funding_source', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select funding source</option>
            <option value="self">Self-funded</option>
            <option value="family">Family support</option>
            <option value="scholarship">Scholarship</option>
            <option value="loan">Education loan</option>
            <option value="employer">Employer sponsored</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Local Currency</label>
          <select
            value={data.local_currency || ''}
            onChange={(e) => handleChange('local_currency', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select currency</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="PKR">PKR - Pakistani Rupee</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="BDT">BDT - Bangladeshi Taka</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Funds (Local Currency)</label>
          <input
            type="number"
            value={data.liquid_funds_local || ''}
            onChange={(e) => handleChange('liquid_funds_local', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Amount in local currency"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equivalent in GBP (Optional)</label>
          <input
            type="number"
            value={data.liquid_funds_gbp || ''}
            onChange={(e) => handleChange('liquid_funds_gbp', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Amount in British Pounds"
          />
        </div>
      </div>
      
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={data.willing_to_provide_statements || false}
            onChange={(e) => handleChange('willing_to_provide_statements', e.target.checked)}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">
            I am willing to provide bank statements and financial documentation for visa application
          </span>
        </label>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>Tip:</strong> UK student visas typically require proof of tuition fees plus £1,334 per month for living costs. 
          Having clear financial documentation will strengthen your application.
        </p>
      </div>
    </div>
  );
}

function PreferencesStep({ data, onUpdate }: { data: StepData; onUpdate: (data: StepData) => void }) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
          <input
            type="text"
            value={data.field_of_study || ''}
            onChange={(e) => handleChange('field_of_study', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Computer Science, Business, Engineering"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Study Level</label>
          <select
            value={data.study_level || ''}
            onChange={(e) => handleChange('study_level', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select level</option>
            <option value="undergraduate">Undergraduate (Bachelor's)</option>
            <option value="postgraduate">Postgraduate (Master's/PhD)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Intake</label>
          <select
            value={data.target_intake || ''}
            onChange={(e) => handleChange('target_intake', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select intake</option>
            <option value="september">September 2024</option>
            <option value="january">January 2025</option>
            <option value="both">Flexible (Either)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City Preference (Optional)</label>
          <input
            type="text"
            value={data.city_preference || ''}
            onChange={(e) => handleChange('city_preference', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., London, Manchester, Edinburgh"
          />
        </div>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm">
          <strong>Almost done!</strong> Our AI will analyze your profile and provide personalized recommendations 
          for UK universities that match your qualifications and preferences.
        </p>
      </div>
    </div>
  );
}
