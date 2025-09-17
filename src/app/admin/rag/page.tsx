'use client';

import RAGStatus from '@/components/admin/RAGStatus';
import RAGTester from '@/components/admin/RAGTester';

export default function RAGPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <RAGStatus />
        <RAGTester />
      </div>
    </div>
  );
}
