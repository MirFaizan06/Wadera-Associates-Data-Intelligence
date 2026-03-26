import { Outlet, Link, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Activity, DollarSign, Database, Users, FileText, LogOut, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UserAvatar from '@/components/ui/UserAvatar';

const ADMIN_LINKS = [
  { to: '/admin/dev', label: 'Developer', icon: Activity, role: 'Developer' },
  { to: '/admin/finance', label: 'Finance', icon: DollarSign, role: 'FinancialManager' },
  { to: '/admin/data', label: 'Data', icon: Database, role: 'DataManager' },
  { to: '/admin/users', label: 'Users', icon: Users, role: 'UserManager' },
  { to: '/admin/cms', label: 'CMS', icon: FileText, role: 'CMSManager' },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user?.role) return <Navigate to="/" replace />;

  const accessibleLinks = ADMIN_LINKS.filter(
    link => user.role?.name === 'Developer' || user.role?.name === link.role
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-brand-navy flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <Link to="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-300" aria-hidden />
            <div>
              <span className="text-white font-bold">Wadera Admin</span>
              <span className="block text-xs text-blue-300">{user.role.name}</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="Admin navigation">
          {accessibleLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {link.label}
                <ChevronRight className="h-3 w-3 ml-auto opacity-50" aria-hidden />
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-blue-800 space-y-1">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <UserAvatar src={user.profilePicture} name={user.fullName || user.email} size={28} />
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{user.fullName || 'My Profile'}</p>
              <p className="text-xs text-blue-300 truncate">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
