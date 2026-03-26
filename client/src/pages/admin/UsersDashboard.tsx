import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserX, UserCheck, Shield, Search, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  deletedAt?: string | null;
  role: { name: string } | null;
}

interface LicenseType { id: string; name: string; }

export default function UsersDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [licenseTypeId, setLicenseTypeId] = useState('');
  const [bannedIps, setBannedIps] = useState<{ id: string; ipAddress: string; reason?: string }[]>([]);
  const [newIp, setNewIp] = useState('');
  const [ipReason, setIpReason] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'ips'>('users');

  const fetchUsers = async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }) });
    const res = await api.get<{ success: boolean; data: { users: UserRow[]; total: number } }>(`/admin/users/users?${params}`);
    setUsers(res.data.data.users);
    setTotal(res.data.data.total);
  };

  const fetchLicenseTypes = async () => {
    const res = await api.get<{ success: boolean; data: LicenseType[] }>('/admin/users/license-types');
    setLicenseTypes(res.data.data);
    if (res.data.data[0]) setLicenseTypeId(res.data.data[0].id);
  };

  const fetchBannedIps = async () => {
    const res = await api.get<{ success: boolean; data: typeof bannedIps }>('/admin/users/banned-ips');
    setBannedIps(res.data.data);
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchLicenseTypes(), fetchBannedIps()]).finally(() => setLoading(false));
  }, [page, search]);

  const toggleSuspend = async (user: UserRow) => {
    if (user.deletedAt) {
      await api.patch(`/admin/users/users/${user.id}/restore`);
    } else {
      await api.patch(`/admin/users/users/${user.id}/suspend`);
    }
    fetchUsers();
  };

  const assignLicense = async (userId: string) => {
    if (!licenseTypeId) return;
    await api.post('/admin/users/licenses', { userId, licenseTypeId });
    alert('License assigned!');
    setSelectedUser(null);
  };

  const banIp = async () => {
    if (!newIp) return;
    await api.post('/admin/users/banned-ips', { ipAddress: newIp, reason: ipReason || undefined });
    setNewIp(''); setIpReason('');
    fetchBannedIps();
  };

  const unbanIp = async (id: string) => {
    await api.delete(`/admin/users/banned-ips/${id}`);
    fetchBannedIps();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Helmet><title>User Manager - Admin</title></Helmet>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Manager</h1>

        <div className="flex gap-2 mb-4">
          {(['users', 'ips'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${activeTab === tab ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {tab === 'users' ? 'Users' : 'IP Ban List'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Users ({total})</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg" aria-label="Search users" />
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 font-medium text-gray-600">User</th>
                    <th className="pb-3 font-medium text-gray-600">Role</th>
                    <th className="pb-3 font-medium text-gray-600">Joined</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{u.fullName || '—'}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="py-3 text-gray-600">{u.role?.name || 'User'}</td>
                      <td className="py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.deletedAt ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>{u.deletedAt ? 'Suspended' : 'Active'}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button onClick={() => toggleSuspend(u)}
                            className={`p-1.5 rounded-lg ${u.deletedAt ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                            aria-label={u.deletedAt ? 'Restore user' : 'Suspend user'}>
                            {u.deletedAt ? <UserCheck className="h-4 w-4" aria-hidden /> : <UserX className="h-4 w-4" aria-hidden />}
                          </button>
                          <button onClick={() => setSelectedUser(u.id)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            aria-label="Assign license">
                            <Shield className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        {selectedUser === u.id && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <select value={licenseTypeId} onChange={e => setLicenseTypeId(e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 mb-2 w-full" aria-label="Select license type">
                              {licenseTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                            </select>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => assignLicense(u.id)}>Assign</Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-4">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ips' && (
          <Card>
            <CardHeader><CardTitle>IP Ban List</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input value={newIp} onChange={e => setNewIp(e.target.value)}
                  placeholder="IP Address" className="text-sm border border-gray-200 rounded px-3 py-2 flex-1" aria-label="IP address to ban" />
                <input value={ipReason} onChange={e => setIpReason(e.target.value)}
                  placeholder="Reason (optional)" className="text-sm border border-gray-200 rounded px-3 py-2 flex-1" aria-label="Ban reason" />
                <Button onClick={banIp} size="sm"><Ban className="h-4 w-4 mr-1" aria-hidden />Ban IP</Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 font-medium text-gray-600">IP Address</th>
                    <th className="pb-2 font-medium text-gray-600">Reason</th>
                    <th className="pb-2 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bannedIps.map(ip => (
                    <tr key={ip.id}>
                      <td className="py-2 font-mono text-gray-900">{ip.ipAddress}</td>
                      <td className="py-2 text-gray-600">{ip.reason || '—'}</td>
                      <td className="py-2">
                        <Button size="sm" variant="outline" onClick={() => unbanIp(ip.id)}>Unban</Button>
                      </td>
                    </tr>
                  ))}
                  {bannedIps.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400">No banned IPs</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
