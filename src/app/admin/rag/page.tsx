'use client';

import RAGStatus from '@/components/admin/RAGStatus';

export default function RAGPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <RAGStatus />
      </div>
    </div>
  );
}
