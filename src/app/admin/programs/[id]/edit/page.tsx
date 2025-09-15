'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProgramForm from '@/components/admin/ProgramForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditProgram() {
  const router = useRouter();
  const params = useParams();
  const programId = parseInt(params.id as string);

  const handleSuccess = (program: any) => {
    // Redirect to the program detail page after successful update
    setTimeout(() => {
      router.push(`/admin/programs/${program.id}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push(`/admin/programs/${programId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/admin/programs/${programId}`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Program
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Program</h1>
        <p className="mt-1 text-gray-600">
          Update program information and documents
        </p>
      </div>

      {/* Form */}
      <ProgramForm 
        programId={programId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
