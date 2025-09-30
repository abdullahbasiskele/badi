import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = {
  title: 'Giriş Yap | Badi Platformu',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{' '}
        <Link href="/register" className="text-primary underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
