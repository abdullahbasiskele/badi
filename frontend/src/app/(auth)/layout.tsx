import type { ReactNode } from 'react';
import { AuthLayout } from '@/components/templates/AuthLayout';

export default function AuthPagesLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLayout title="Badi Platformu" description="Hesabınıza giriş yapın veya yeni bir hesap oluşturun">
      {children}
    </AuthLayout>
  );
}
