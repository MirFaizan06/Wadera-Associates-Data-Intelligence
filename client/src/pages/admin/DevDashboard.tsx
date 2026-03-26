import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Activity, Users, Database, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';


interface HealthData {
  status: string;
  uptime: number;
  memory: { rss: string; heap: string };
  stats: { userCount: number; datasetCount: number; purchaseCount: number };
  nodeVersion: string;
  timestamp: string;
}

interface LogEntry {
  level?: string;
  message?: string;
  timestamp?: string;
  raw?: string;
}

export default function DevDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'logs' | 'errors'>('health');

  const fetchAll = async () => {
    setRefreshing(true);
    const [h, l, e] = await Promise.allSettled([
      api.get<{ success: boolean; data: HealthData }>('/admin/dev/health'),
      api.get<{ success: boolean; data: { logs: LogEntry[] } }>('/admin/dev/logs'),
      api.get<{ success: boolean; data: { logs: LogEntry[] } }>('/admin/dev/error-logs'),
    ]);
    if (h.status === 'fulfilled') setHealth(h.value.data.data);
    if (l.status === 'fulfilled') setLogs(l.value.data.data.logs);
    if (e.status === 'fulfilled') setErrorLogs(e.value.data.data.logs);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const refreshRates = async () => {
    await api.post('/admin/dev/exchange-rates/refresh');
    alert('Exchange rates refreshed!');
  };

  return (
    <>
      <Helmet><title>Developer Dashboard - Admin</title></Helmet>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <Button onClick={fetchAll} loading={refreshing} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden />Refresh
          </Button>
        </div>

        {/* Stats */}
        {health && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Users', value: health.stats.userCount, icon: Users, color: 'text-blue-600' },
              { label: 'Datasets', value: health.stats.datasetCount, icon: Database, color: 'text-green-600' },
              { label: 'Sales', value: health.stats.purchaseCount, icon: DollarSign, color: 'text-yellow-600' },
              { label: 'Uptime', value: `${Math.floor(health.uptime / 3600)}h`, icon: Activity, color: 'text-purple-600' },
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
        )}

        {/* Server Info */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader><CardTitle>Memory Usage</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">RSS</span><span className="font-mono">{health.memory.rss}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Heap</span><span className="font-mono">{health.memory.heap}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Node</span><span className="font-mono">{health.nodeVersion}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" onClick={refreshRates} className="w-full">Refresh Exchange Rates</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['health', 'logs', 'errors'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${activeTab === tab ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'errors' && errorLogs.length > 0 && <span className="ml-1 bg-red-100 text-red-700 text-xs px-1 rounded">{errorLogs.length}</span>}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="pt-4">
            {activeTab === 'health' && (
              <div className="text-sm text-gray-600">
                <p>Status: <span className="text-green-600 font-medium">Healthy</span></p>
                <p className="mt-1">Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Loading...'}</p>
              </div>
            )}
            {(activeTab === 'logs' || activeTab === 'errors') && (
              <div className="max-h-[500px] overflow-y-auto font-mono text-xs space-y-1">
                {(activeTab === 'logs' ? logs : errorLogs).map((log, i) => (
                  <div key={i} className={`p-2 rounded ${log.level === 'error' ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-700'}`}>
                    {log.timestamp && <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}] </span>}
                    {log.level && <span className={`font-bold uppercase mr-2 ${log.level === 'error' ? 'text-red-600' : log.level === 'warn' ? 'text-yellow-600' : 'text-green-600'}`}>{log.level}</span>}
                    {log.message || log.raw}
                  </div>
                ))}
                {(activeTab === 'logs' ? logs : errorLogs).length === 0 && (
                  <p className="text-gray-400 text-center py-4">No logs available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
