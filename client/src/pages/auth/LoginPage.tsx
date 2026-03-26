import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const result = await login(data.email, data.password);
      if (result.requiresOtp) {
        navigate('/auth/verify-otp', { state: { email: data.email, type: 'LOGIN' } });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || t('auth.login.failed');
      setApiError(msg);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.login')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center mb-6">
              <img src="/images/logo.webp" alt="Wadera Associates" className="h-10 w-auto" width={160} height={40} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.login.title')}</h1>
            <p className="text-gray-500 mt-1">{t('auth.login.subtitle')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input id="email" type="email" label={t('auth.login.emailLabel')} placeholder={t('auth.login.emailPlaceholder')} error={errors.email?.message} {...register('email')} />
              <Input id="password" type="password" label={t('auth.login.passwordLabel')} placeholder={t('auth.login.passwordPlaceholder')} error={errors.password?.message} {...register('password')} />
              {apiError && <p className="text-sm text-red-600" role="alert">{apiError}</p>}
              <Button type="submit" className="w-full" loading={isSubmitting}>{t('auth.login.signInBtn')}</Button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/auth/forgot-password" className="text-sm text-brand-blue hover:underline">{t('auth.login.forgotPassword')}</Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.login.noAccount')}{' '}
            <Link to="/auth/register" className="text-brand-blue font-medium hover:underline">{t('auth.login.createOne')}</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-blue transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('auth.login.backToWebsite')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
