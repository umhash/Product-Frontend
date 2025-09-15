'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProgramForm from '@/components/admin/ProgramForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewProgram() {
  const router = useRouter();

  const handleSuccess = (program: any) => {
    // Redirect to the program detail page after successful creation
    setTimeout(() => {
      router.push(`/admin/programs/${program.id}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/admin/programs');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/programs"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Programs
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Program</h1>
        <p className="mt-1 text-gray-600">
          Add a new university program to the knowledgebase
        </p>
      </div>

      {/* Form */}
      <ProgramForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
