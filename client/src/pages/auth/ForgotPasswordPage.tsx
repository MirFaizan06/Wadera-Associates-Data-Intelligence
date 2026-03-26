import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.forgotPassword')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">{t('auth.forgotPassword.title')}</h1>
          {sent ? (
            <div className="bg-white rounded-xl border p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700">{t('auth.forgotPassword.sent')}</p>
              <Link to="/auth/login" className="mt-4 inline-block text-brand-blue text-sm hover:underline">{t('auth.forgotPassword.backToLogin')}</Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="email" type="email" label={t('auth.forgotPassword.emailLabel')} value={email} onChange={e => setEmail(e.target.value)} required />
                <Button type="submit" className="w-full" loading={loading}>{t('auth.forgotPassword.sendBtn')}</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
