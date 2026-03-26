import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

function Avatar({ src, name, size = 96 }: { src?: string | null; name?: string | null; size?: number }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-4 border-white shadow"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-[#A67564] text-white flex items-center justify-center font-bold border-4 border-white shadow select-none"
    >
      {initials}
    </div>
  );
}

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm({
    defaultValues: { fullName: user?.fullName || '', phone: user?.phone || '' },
  });

  const passwordForm = useForm({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSaveProfile = async (data: { fullName: string; phone: string }) => {
    await api.put('/auth/profile', data);
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const onChangePassword = async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    setPasswordMsg('');
    setPasswordError('');
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setPasswordMsg('Password changed successfully. You may need to log in again.');
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to change password';
      setPasswordError(msg);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB');
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
      setAvatarError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const roleName = user?.role?.name || 'Admin';

  return (
    <>
      <Helmet><title>My Profile - {roleName} | Wadera Associates</title></Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#723E31] to-[#A67564] h-24" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="relative">
                <Avatar src={user?.profilePicture} name={user?.fullName} size={96} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm"
                  title="Change photo"
                >
                  ✎
                </button>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user?.fullName || user?.email}</h1>
                <span className="inline-block text-xs bg-[#F2F2F2] text-[#723E31] px-2 py-0.5 rounded font-medium">
                  {roleName}
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
            {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
          </div>
        </div>

        {/* Profile data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...profileForm.register('fullName')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67564]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                {...profileForm.register('phone')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67564]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                value={roleName}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 text-sm"
              />
            </div>
            {saved && <p className="text-sm text-green-600">Saved!</p>}
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="px-4 py-2 bg-[#A67564] text-white rounded-md text-sm font-medium hover:bg-[#723E31] disabled:opacity-50"
            >
              {profileForm.formState.isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                {...passwordForm.register('oldPassword', { required: true })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67564]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67564]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...passwordForm.register('confirmPassword', { required: true })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67564]"
              />
            </div>
            {passwordMsg && <p className="text-sm text-green-600">{passwordMsg}</p>}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="px-4 py-2 bg-[#723E31] text-white rounded-md text-sm font-medium hover:bg-[#4a2820] disabled:opacity-50"
            >
              {passwordForm.formState.isSubmitting ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
