'use client';

import { usePathname } from 'next/navigation';
import AdminAuthCheck from '@/components/admin/AdminAuthCheck';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Don't wrap login page with auth check and layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Wrap other admin pages with auth check and layout
  return (
    <AdminAuthCheck>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthCheck>
  );
}
