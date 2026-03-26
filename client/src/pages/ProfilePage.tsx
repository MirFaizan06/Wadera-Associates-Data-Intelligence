import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

function UserAvatar({ src, name, size = 80 }: { src?: string | null; name?: string | null; size?: number }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-gray-200"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-[#A67564] text-white flex items-center justify-center font-semibold border-2 border-gray-200 select-none"
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { fullName: user?.fullName || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data: { fullName: string; phone: string }) => {
    await api.put('/auth/profile', data);
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t('profile.picture.tooLarge'));
      return;
    }
    setAvatarError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/auth/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
    } catch {
      setAvatarError(t('profile.picture.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.profile')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="container max-w-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

          {/* Avatar */}
          <Card className="mb-6">
            <CardHeader><CardTitle>{t('profile.picture.cardTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <UserAvatar src={user?.profilePicture} name={user?.fullName} size={80} />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? t('profile.picture.uploading') : t('profile.picture.changePhoto')}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">{t('profile.picture.hint')}</p>
                  {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>{t('profile.details.cardTitle')}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input id="email" label={t('profile.details.emailLabel')} value={user?.email || ''} disabled />
                <Input id="fullName" label={t('profile.details.fullNameLabel')} {...register('fullName')} />
                <Input id="phone" label={t('profile.details.phoneLabel')} {...register('phone')} />
                {saved && <p className="text-sm text-green-600">{t('profile.details.saved')}</p>}
                <Button type="submit" loading={isSubmitting}>{t('profile.details.saveBtn')}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
