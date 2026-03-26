import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must have upper, lower & number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await api.post('/auth/register', { email: data.email, password: data.password, fullName: data.fullName });
      if (avatarFile) {
        sessionStorage.setItem('pendingAvatarUpload', 'true');
      }
      navigate('/auth/verify-otp', { state: { email: data.email, type: 'REGISTER', hasAvatar: !!avatarFile } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || t('auth.register.failed');
      setApiError(msg);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.register')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center mb-6">
              <img src="/images/logo.webp" alt="Wadera Associates" className="h-10 w-auto" width={160} height={40} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.register.title')}</h1>
            <p className="text-gray-500 mt-1">{t('auth.register.subtitle')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Optional avatar picker */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div
                  className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#A67564] transition"
                  onClick={() => fileInputRef.current?.click()}
                  title={t('auth.register.avatarHint')}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400">+</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
                <p className="text-xs text-gray-500">{t('auth.register.avatarHint')}</p>
              </div>

              <Input id="fullName" label={t('auth.register.fullNameLabel')} placeholder={t('auth.register.fullNamePlaceholder')} error={errors.fullName?.message} {...register('fullName')} />
              <Input id="email" type="email" label={t('auth.register.emailLabel')} placeholder={t('auth.register.emailPlaceholder')} error={errors.email?.message} {...register('email')} />
              <Input id="password" type="password" label={t('auth.register.passwordLabel')} placeholder={t('auth.register.passwordPlaceholder')} error={errors.password?.message} {...register('password')} />
              <Input id="confirmPassword" type="password" label={t('auth.register.confirmLabel')} placeholder={t('auth.register.confirmPlaceholder')} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              {apiError && <p className="text-sm text-red-600" role="alert">{apiError}</p>}
              <Button type="submit" className="w-full" loading={isSubmitting}>{t('auth.register.createBtn')}</Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.register.alreadyHave')}{' '}
            <Link to="/auth/login" className="text-brand-blue font-medium hover:underline">{t('auth.register.signIn')}</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-blue transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('auth.register.backToWebsite')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
