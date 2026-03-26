import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface Order {
  id: string;
  amountINR: number;
  status: string;
  purchasedAt: string;
  guestEmail: string | null;
  user: { email: string; fullName: string | null } | null;
  timeSeries: { name: string; slug: string };
}

interface ChartItem { label: string; revenue: number; orders: number; }

export default function FinanceDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [total, setTotal] = useState(0);
  const [chart, setChart] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(filter && { status: filter }) });
    const res = await api.get<{ success: boolean; data: { orders: Order[]; total: number; revenue: number } }>(`/admin/finance/orders?${params}`);
    setOrders(res.data.data.orders);
    setRevenue(res.data.data.revenue);
    setTotal(res.data.data.total);
  };

  const fetchChart = async () => {
    const res = await api.get<{ success: boolean; data: ChartItem[] }>('/admin/finance/revenue-chart');
    setChart(res.data.data);
  };

  useEffect(() => {
    Promise.all([fetchOrders(), fetchChart()]).finally(() => setLoading(false));
  }, [page, filter]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Helmet><title>Finance Dashboard - Admin</title></Helmet>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
            { label: 'Total Orders', value: total, icon: ShoppingCart, color: 'text-blue-600' },
            { label: 'Avg Order', value: total > 0 ? `₹${Math.round(revenue / total).toLocaleString()}` : '₹0', icon: TrendingUp, color: 'text-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 ${color}`}><Icon className="h-5 w-5" aria-hidden /></div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue chart */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Revenue (Last 12 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Orders</CardTitle>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1" aria-label="Filter by status">
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 font-medium text-gray-600">Customer</th>
                    <th className="pb-3 font-medium text-gray-600">Dataset</th>
                    <th className="pb-3 font-medium text-gray-600">Amount</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td className="py-3 text-gray-700">{o.user?.email || o.guestEmail || 'Guest'}</td>
                      <td className="py-3 text-gray-700">{o.timeSeries.name}</td>
                      <td className="py-3 font-medium">₹{o.amountINR.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          o.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{o.status}</span>
                      </td>
                      <td className="py-3 text-gray-500">{formatDate(o.purchasedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">{total} total orders</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
