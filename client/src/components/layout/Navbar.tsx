import { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShoppingBag, ChevronDown, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import SettingsModal, { SettingsTooltip, useFirstVisitTooltip } from '@/components/ui/SettingsModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const { showTooltip, closeTooltip } = useFirstVisitTooltip();

  const NAV_LINKS = [
    { to: '/', label: t('nav.home') },
    { to: '/datasets', label: t('nav.datasets') },
    { to: '/free-data', label: t('nav.freeData') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
        <div className="container">
          <div className="flex h-[72px] items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" aria-label="ARW Analytics Home" className="shrink-0">
              <img
                src="/images/logo.webp"
                alt="ARW Analytics – Data Intelligence"
                className="h-14 w-auto"
                width={160}
                height={56}
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'text-brand-blue bg-blue-50'
                        : 'text-gray-600 hover:text-brand-blue hover:bg-gray-50'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side — desktop */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Settings button */}
              <div className="relative">
                <button
                  ref={settingsBtnRef}
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:text-brand-blue hover:border-brand-blue bg-white transition-all"
                  aria-label={t('settings.title')}
                  title={t('settings.title')}
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  <span className="hidden lg:inline text-sm font-medium">{t('settings.title')}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-gray-200 mx-1" aria-hidden />

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <UserAvatar src={user.profilePicture} name={user.fullName || user.email} size={28} />
                    <span className="max-w-[120px] truncate">{user.fullName || user.email.split('@')[0]}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} aria-hidden />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-lg bg-white border border-gray-100 py-1.5 z-50">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                        </div>
                        <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-blue transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <User className="h-4 w-4" /> {t('nav.myProfile')}
                        </Link>
                        <Link to="/purchases" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-blue transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <ShoppingBag className="h-4 w-4" /> {t('nav.myPurchases')}
                        </Link>
                        {user.role && (
                          <Link
                            to={`/admin/${user.role.name === 'Developer' ? 'dev' : user.role.name.toLowerCase().replace('manager', '')}`}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-blue hover:bg-blue-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t('nav.adminPanel')}
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" /> {t('nav.signOut')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-brand-blue">
                    <Link to="/auth/login">{t('nav.signIn')}</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-brand-blue hover:bg-blue-700 text-white rounded-lg px-4">
                    <Link to="/auth/register">{t('nav.getStarted')}</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile: settings + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label={t('settings.title')}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <nav className="md:hidden pb-4 border-t border-gray-100 pt-3" aria-label="Mobile navigation">
              <div className="space-y-0.5 mb-3">
                {NAV_LINKS.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn('block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'text-brand-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50')
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2 px-1">
                {user ? (
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-red-500 border-red-200 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-1" /> {t('nav.signOut')}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to="/auth/login" onClick={() => setMobileOpen(false)}>{t('nav.signIn')}</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1 bg-brand-blue text-white">
                      <Link to="/auth/register" onClick={() => setMobileOpen(false)}>{t('nav.register')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* First-visit tooltip */}
      {showTooltip && (
        <SettingsTooltip targetRef={settingsBtnRef} onClose={closeTooltip} />
      )}
    </>
  );
}
