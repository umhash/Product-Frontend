'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { programsApi, documentsApi } from '@/lib/adminApi';
import { 
  BookOpenIcon, 
  DocumentIcon, 
  PlusIcon,
  EyeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalPrograms: number;
  activePrograms: number;
  totalDocuments: number;
  recentPrograms: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    activePrograms: 0,
    totalDocuments: 0,
    recentPrograms: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load programs and documents
      const [programsResponse, documentsResponse] = await Promise.all([
        programsApi.getPrograms({ per_page: 100 }),
        documentsApi.getAllDocuments()
      ]);

      const totalPrograms = programsResponse.total;
      const activePrograms = programsResponse.programs.filter((p: any) => p.is_active).length;
      const totalDocuments = documentsResponse.total;
      const recentPrograms = programsResponse.programs.slice(0, 5);

      setStats({
        totalPrograms,
        activePrograms,
        totalDocuments,
        recentPrograms
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI Knowledge Hub
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Intelligent university program management powered by AI agents
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Streamline admissions guidance with data-driven insights
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Total Programs
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {stats.totalPrograms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    Active Programs
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {stats.activePrograms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <DocumentIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    AI Documents
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900">
                    {stats.totalDocuments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden shadow-lg rounded-xl border border-indigo-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-center">
              <Link
                href="/admin/programs/new"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add New Program
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Programs */}
      <div className="bg-white shadow-lg rounded-xl border border-slate-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Recent AI Programs
              </h3>
              <p className="text-sm text-slate-500 mt-1">Latest additions to your knowledge base</p>
            </div>
            <Link
              href="/admin/programs"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
            >
              View All Programs
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {stats.recentPrograms.length > 0 ? (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {stats.recentPrograms.map((program: any) => (
                  <li key={program.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {program.program_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {program.university_name} • {program.city}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              program.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {program.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {program.document_count} docs
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          href={`/admin/programs/${program.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No programs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new program.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/programs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Program
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
