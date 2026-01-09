'use client';

import { useState, useEffect } from 'react';
import { programsApi } from '@/lib/adminApi';
import PDFUpload from './PDFUpload';

interface ProgramFormProps {
  programId?: number;
  onSuccess?: (program: any) => void;
  onCancel?: () => void;
}

interface ProgramFormData {
  university_name: string;
  program_name: string;
  program_level: string;
  field_of_study: string;
  min_ielts_overall: number | '';
  min_ielts_components: number | '';
  min_toefl_overall: number | '';
  min_pte_overall: number | '';
  duolingo_min_score: number | '';
  min_gpa_4_scale: number | '';
  min_percentage: number | '';
  required_qualification: string;
  tuition_fee_min_gbp: number | '';
  tuition_fee_max_gbp: number | '';
  tuition_fee_gbp: number | '';
  living_cost_gbp: number | '';
  initial_deposit_gbp: number | '';
  duration_months: number | '';
  intake_months: number[];
  city: string;
  program_description: string;
  programs_available: string;
  ug_entry_requirements: string;
  pg_entry_requirements: string;
  english_requirements_text: string;
  moi_accepted: string;
  scholarships: string;
  study_gap_acceptable: string;
  special_notes: string;
  entry_requirements_text: string;
  is_active: boolean;
}

const initialFormData: ProgramFormData = {
  university_name: '',
  program_name: '',
  program_level: 'postgraduate',
  field_of_study: '',
  min_ielts_overall: '',
  min_ielts_components: '',
  min_toefl_overall: '',
  min_pte_overall: '',
  duolingo_min_score: '',
  min_gpa_4_scale: '',
  min_percentage: '',
  required_qualification: '',
  tuition_fee_min_gbp: '',
  tuition_fee_max_gbp: '',
  tuition_fee_gbp: '',
  living_cost_gbp: '',
  initial_deposit_gbp: '',
  duration_months: '',
  intake_months: [],
  city: '',
  program_description: '',
  programs_available: '',
  ug_entry_requirements: '',
  pg_entry_requirements: '',
  english_requirements_text: '',
  moi_accepted: '',
  scholarships: '',
  study_gap_acceptable: '',
  special_notes: '',
  entry_requirements_text: '',
  is_active: true,
};

export default function ProgramForm({ programId, onSuccess, onCancel }: ProgramFormProps) {
  const [formData, setFormData] = useState<ProgramFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = !!programId;

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    try {
      setIsLoading(true);
      const program = await programsApi.getProgram(programId!);
      setFormData({
        ...program,
        min_ielts_overall: program.min_ielts_overall || '',
        min_ielts_components: program.min_ielts_components || '',
        min_toefl_overall: program.min_toefl_overall || '',
        min_pte_overall: program.min_pte_overall || '',
        duolingo_min_score: program.duolingo_min_score || '',
        min_gpa_4_scale: program.min_gpa_4_scale || '',
        min_percentage: program.min_percentage || '',
        tuition_fee_min_gbp: program.tuition_fee_min_gbp || '',
        tuition_fee_max_gbp: program.tuition_fee_max_gbp || '',
        tuition_fee_gbp: program.tuition_fee_gbp || '',
        living_cost_gbp: program.living_cost_gbp || '',
        initial_deposit_gbp: program.initial_deposit_gbp || '',
        duration_months: program.duration_months || '',
        intake_months: program.intake_months || [],
        required_qualification: program.required_qualification || '',
        program_description: program.program_description || '',
        programs_available: program.programs_available || '',
        ug_entry_requirements: program.ug_entry_requirements || '',
        pg_entry_requirements: program.pg_entry_requirements || '',
        english_requirements_text: program.english_requirements_text || '',
        moi_accepted: program.moi_accepted || '',
        scholarships: program.scholarships || '',
        study_gap_acceptable: program.study_gap_acceptable || '',
        special_notes: program.special_notes || '',
        entry_requirements_text: program.entry_requirements_text || '',
      });
    } catch (error) {
      setError('Failed to load program data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIntakeMonthsChange = (month: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      intake_months: checked 
        ? [...prev.intake_months, month].sort()
        : prev.intake_months.filter(m => m !== month)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Convert empty strings to null for numeric fields
      const submitData = {
        ...formData,
        min_ielts_overall: formData.min_ielts_overall === '' ? null : formData.min_ielts_overall,
        min_ielts_components: formData.min_ielts_components === '' ? null : formData.min_ielts_components,
        min_toefl_overall: formData.min_toefl_overall === '' ? null : formData.min_toefl_overall,
        min_pte_overall: formData.min_pte_overall === '' ? null : formData.min_pte_overall,
        duolingo_min_score: formData.duolingo_min_score === '' ? null : formData.duolingo_min_score,
        min_gpa_4_scale: formData.min_gpa_4_scale === '' ? null : formData.min_gpa_4_scale,
        min_percentage: formData.min_percentage === '' ? null : formData.min_percentage,
        tuition_fee_min_gbp: formData.tuition_fee_min_gbp === '' ? null : formData.tuition_fee_min_gbp,
        tuition_fee_max_gbp: formData.tuition_fee_max_gbp === '' ? null : formData.tuition_fee_max_gbp,
        tuition_fee_gbp: formData.tuition_fee_gbp === '' ? null : formData.tuition_fee_gbp,
        living_cost_gbp: formData.living_cost_gbp === '' ? null : formData.living_cost_gbp,
        initial_deposit_gbp: formData.initial_deposit_gbp === '' ? null : formData.initial_deposit_gbp,
        duration_months: formData.duration_months === '' ? null : formData.duration_months,
        required_qualification: formData.required_qualification || null,
        program_description: formData.program_description || null,
        programs_available: formData.programs_available || null,
        ug_entry_requirements: formData.ug_entry_requirements || null,
        pg_entry_requirements: formData.pg_entry_requirements || null,
        english_requirements_text: formData.english_requirements_text || null,
        moi_accepted: formData.moi_accepted || null,
        scholarships: formData.scholarships || null,
        study_gap_acceptable: formData.study_gap_acceptable || null,
        special_notes: formData.special_notes || null,
        entry_requirements_text: formData.entry_requirements_text || null,
      };

      let program;
      if (isEditing) {
        program = await programsApi.updateProgram(programId!, submitData);
      } else {
        program = await programsApi.createProgram(submitData);
      }

      setSuccess(`Program ${isEditing ? 'updated' : 'created'} successfully!`);
      onSuccess?.(program);
    } catch (error: any) {
      setError(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} program`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!programId) {
      setError('Please save the program first before uploading documents');
      return;
    }

    try {
      setIsUploading(true);
      await programsApi.uploadDocuments(programId, files);
      setSuccess('Documents uploaded successfully!');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const intakeMonths = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="university_name" className="block text-sm font-medium text-gray-700">
              University Name *
            </label>
            <input
              type="text"
              name="university_name"
              id="university_name"
              required
              value={formData.university_name}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="program_name" className="block text-sm font-medium text-gray-700">
              Program Name *
            </label>
            <input
              type="text"
              name="program_name"
              id="program_name"
              required
              value={formData.program_name}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="program_level" className="block text-sm font-medium text-gray-700">
              Program Level *
            </label>
            <select
              name="program_level"
              id="program_level"
              required
              value={formData.program_level}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          </div>

          <div>
            <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700">
              Field of Study *
            </label>
            <input
              type="text"
              name="field_of_study"
              id="field_of_study"
              required
              value={formData.field_of_study}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              name="city"
              id="city"
              required
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="duration_months" className="block text-sm font-medium text-gray-700">
              Duration (months)
            </label>
            <input
              type="number"
              name="duration_months"
              id="duration_months"
              min="1"
              value={formData.duration_months}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Intake Months
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {intakeMonths.map((month) => (
              <label key={month.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.intake_months.includes(month.value)}
                  onChange={(e) => handleIntakeMonthsChange(month.value, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{month.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="program_description" className="block text-sm font-medium text-gray-700">
            Program Description
          </label>
          <textarea
            name="program_description"
            id="program_description"
            rows={4}
            value={formData.program_description}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Active Program</span>
          </label>
        </div>
      </div>

      {/* Entry Requirements */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Entry Requirements</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="min_ielts_overall" className="block text-sm font-medium text-gray-700">
              Min IELTS Overall
            </label>
            <input
              type="number"
              name="min_ielts_overall"
              id="min_ielts_overall"
              step="0.5"
              min="0"
              max="9"
              value={formData.min_ielts_overall}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="min_ielts_components" className="block text-sm font-medium text-gray-700">
              Min IELTS Components
            </label>
            <input
              type="number"
              name="min_ielts_components"
              id="min_ielts_components"
              step="0.5"
              min="0"
              max="9"
              value={formData.min_ielts_components}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="min_toefl_overall" className="block text-sm font-medium text-gray-700">
              Min TOEFL Overall
            </label>
            <input
              type="number"
              name="min_toefl_overall"
              id="min_toefl_overall"
              min="0"
              max="120"
              value={formData.min_toefl_overall}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="min_pte_overall" className="block text-sm font-medium text-gray-700">
              Min PTE Overall
            </label>
            <input
              type="number"
              name="min_pte_overall"
              id="min_pte_overall"
              min="0"
              max="90"
              value={formData.min_pte_overall}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="duolingo_min_score" className="block text-sm font-medium text-gray-700">
              Min Duolingo Score
            </label>
            <input
              type="number"
              name="duolingo_min_score"
              id="duolingo_min_score"
              min="0"
              max="160"
              value={formData.duolingo_min_score}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="min_gpa_4_scale" className="block text-sm font-medium text-gray-700">
              Min GPA (4.0 scale)
            </label>
            <input
              type="number"
              name="min_gpa_4_scale"
              id="min_gpa_4_scale"
              step="0.1"
              min="0"
              max="4"
              value={formData.min_gpa_4_scale}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="min_percentage" className="block text-sm font-medium text-gray-700">
              Min Percentage
            </label>
            <input
              type="number"
              name="min_percentage"
              id="min_percentage"
              min="0"
              max="100"
              value={formData.min_percentage}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="required_qualification" className="block text-sm font-medium text-gray-700">
            Required Qualification
          </label>
          <input
            type="text"
            name="required_qualification"
            id="required_qualification"
            value={formData.required_qualification}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="entry_requirements_text" className="block text-sm font-medium text-gray-700">
            Entry Requirements (Detailed Text)
          </label>
          <textarea
            name="entry_requirements_text"
            id="entry_requirements_text"
            rows={3}
            value={formData.entry_requirements_text}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="ug_entry_requirements" className="block text-sm font-medium text-gray-700">
            Undergraduate Entry Requirements
          </label>
          <textarea
            name="ug_entry_requirements"
            id="ug_entry_requirements"
            rows={3}
            value={formData.ug_entry_requirements}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="pg_entry_requirements" className="block text-sm font-medium text-gray-700">
            Postgraduate Entry Requirements
          </label>
          <textarea
            name="pg_entry_requirements"
            id="pg_entry_requirements"
            rows={3}
            value={formData.pg_entry_requirements}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="english_requirements_text" className="block text-sm font-medium text-gray-700">
            English Language Requirements (Detailed Text)
          </label>
          <textarea
            name="english_requirements_text"
            id="english_requirements_text"
            rows={3}
            value={formData.english_requirements_text}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="moi_accepted" className="block text-sm font-medium text-gray-700">
            Medium of Instruction (MOI) Accepted
          </label>
          <input
            type="text"
            name="moi_accepted"
            id="moi_accepted"
            value={formData.moi_accepted}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="tuition_fee_min_gbp" className="block text-sm font-medium text-gray-700">
              Tuition Fee Min (GBP)
            </label>
            <input
              type="number"
              name="tuition_fee_min_gbp"
              id="tuition_fee_min_gbp"
              min="0"
              value={formData.tuition_fee_min_gbp}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="For fee range (optional)"
            />
          </div>

          <div>
            <label htmlFor="tuition_fee_max_gbp" className="block text-sm font-medium text-gray-700">
              Tuition Fee Max (GBP)
            </label>
            <input
              type="number"
              name="tuition_fee_max_gbp"
              id="tuition_fee_max_gbp"
              min="0"
              value={formData.tuition_fee_max_gbp}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="For fee range (optional)"
            />
          </div>

          <div>
            <label htmlFor="tuition_fee_gbp" className="block text-sm font-medium text-gray-700">
              Tuition Fee (GBP)
            </label>
            <input
              type="number"
              name="tuition_fee_gbp"
              id="tuition_fee_gbp"
              min="0"
              value={formData.tuition_fee_gbp}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="For single fee (optional)"
            />
          </div>

          <div>
            <label htmlFor="living_cost_gbp" className="block text-sm font-medium text-gray-700">
              Living Cost (GBP)
            </label>
            <input
              type="number"
              name="living_cost_gbp"
              id="living_cost_gbp"
              min="0"
              value={formData.living_cost_gbp}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="initial_deposit_gbp" className="block text-sm font-medium text-gray-700">
              Initial Deposit (GBP)
            </label>
            <input
              type="number"
              name="initial_deposit_gbp"
              id="initial_deposit_gbp"
              min="0"
              value={formData.initial_deposit_gbp}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="programs_available" className="block text-sm font-medium text-gray-700">
              Available Programs
            </label>
            <textarea
              name="programs_available"
              id="programs_available"
              rows={3}
              value={formData.programs_available}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="scholarships" className="block text-sm font-medium text-gray-700">
              Scholarship Information
            </label>
            <textarea
              name="scholarships"
              id="scholarships"
              rows={3}
              value={formData.scholarships}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="study_gap_acceptable" className="block text-sm font-medium text-gray-700">
              Study Gap Policy
            </label>
            <input
              type="text"
              name="study_gap_acceptable"
              id="study_gap_acceptable"
              value={formData.study_gap_acceptable}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="special_notes" className="block text-sm font-medium text-gray-700">
              Special Notes
            </label>
            <textarea
              name="special_notes"
              id="special_notes"
              rows={3}
              value={formData.special_notes}
              onChange={handleChange}
              className="mt-1 block w-full border-yellow-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm bg-yellow-50"
            />
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
          <PDFUpload
            onFilesSelected={handleFileUpload}
            isUploading={isUploading}
            maxFiles={10}
          />
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Program' : 'Create Program')}
        </button>
      </div>
    </form>
  );
}
