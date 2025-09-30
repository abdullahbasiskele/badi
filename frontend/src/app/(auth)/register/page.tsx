import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = {
  title: 'Kayıt Ol | Badi Platformu',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{' '}
        <Link href="/login" className="text-primary underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
