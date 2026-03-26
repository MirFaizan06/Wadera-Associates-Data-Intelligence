import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function OtpPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { email, type } = (location.state || {}) as { email: string; type: string };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  if (!email) {
    navigate('/auth/login');
    return null;
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError(t('auth.otp.enterAll')); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp: code, type });
      await refreshUser();
      navigate('/');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || t('auth.otp.invalidOtp'));
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    await api.post('/auth/resend-otp', { email, type });
    setError('');
    alert(t('auth.otp.resendAlert'));
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.otp')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.otp.title')}</h1>
          <p className="text-gray-500 mb-8">{t('auth.otp.subtitle')} <strong>{email}</strong></p>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex gap-3 justify-center mb-6" role="group" aria-label="OTP input">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-blue"
                  aria-label={t('auth.otp.digitLabel', { n: i + 1 })}
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
            <Button className="w-full" onClick={handleVerify} loading={loading}>{t('auth.otp.verifyBtn')}</Button>
            <button onClick={handleResend} className="mt-4 text-sm text-brand-blue hover:underline">{t('auth.otp.resend')}</button>
          </div>
        </div>
      </div>
    </>
  );
}
