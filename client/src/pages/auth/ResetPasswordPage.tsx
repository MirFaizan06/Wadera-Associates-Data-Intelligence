import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

const schema = z.object({
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') || '';
  const otp = params.get('otp') || '';
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { newPassword: string }) => {
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: data.newPassword });
      navigate('/auth/login');
    } catch { setApiError(t('auth.resetPassword.failed')); }
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.resetPassword')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">{t('auth.resetPassword.title')}</h1>
          <div className="bg-white rounded-xl border p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input id="newPassword" type="password" label={t('auth.resetPassword.newPasswordLabel')} error={errors.newPassword?.message} {...register('newPassword')} />
              <Input id="confirmPassword" type="password" label={t('auth.resetPassword.confirmLabel')} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              {apiError && <p className="text-sm text-red-600">{apiError}</p>}
              <Button type="submit" className="w-full" loading={isSubmitting}>{t('auth.resetPassword.resetBtn')}</Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
