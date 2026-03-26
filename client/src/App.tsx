import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { RTL_LANGUAGES, type LanguageCode } from './i18n';

function I18nDirectionSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language as LanguageCode);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const DatasetsPage = lazy(() => import('./pages/DatasetsPage'));
const DatasetDetailPage = lazy(() => import('./pages/DatasetDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const OtpPage = lazy(() => import('./pages/auth/OtpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const FreeDataPage = lazy(() => import('./pages/FreeDataPage'));
const FreeDataDetailPage = lazy(() => import('./pages/FreeDataDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin pages
const DevDashboard = lazy(() => import('./pages/admin/DevDashboard'));
const FinanceDashboard = lazy(() => import('./pages/admin/FinanceDashboard'));
const DataDashboard = lazy(() => import('./pages/admin/DataDashboard'));
const UsersDashboard = lazy(() => import('./pages/admin/UsersDashboard'));
const CmsDashboard = lazy(() => import('./pages/admin/CmsDashboard'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role?.name !== role && user.role?.name !== 'Developer') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <I18nDirectionSync />
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/datasets" element={<DatasetsPage />} />
              <Route path="/datasets/:slug" element={<DatasetDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/pages/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/pages/terms-of-service" element={<TermsPage />} />
              <Route path="/pages/:slug" element={<StaticPage />} />
              <Route path="/free-data" element={<FreeDataPage />} />
              <Route path="/free-data/:slug" element={<FreeDataDetailPage />} />
            </Route>

            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/verify-otp" element={<OtpPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Protected user routes */}
            <Route element={<PublicLayout />}>
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            </Route>

            {/* Download (with token or auth) */}
            <Route path="/download/:token" element={<DownloadPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dev" element={<AdminRoute role="Developer"><DevDashboard /></AdminRoute>} />
              <Route path="finance" element={<AdminRoute role="FinancialManager"><FinanceDashboard /></AdminRoute>} />
              <Route path="data" element={<AdminRoute role="DataManager"><DataDashboard /></AdminRoute>} />
              <Route path="users" element={<AdminRoute role="UserManager"><UsersDashboard /></AdminRoute>} />
              <Route path="cms" element={<AdminRoute role="CMSManager"><CmsDashboard /></AdminRoute>} />
              <Route path="profile" element={<ProtectedRoute><AdminProfilePage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </CurrencyProvider>
    </AuthProvider>
  );
}
