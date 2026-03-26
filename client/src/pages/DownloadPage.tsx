import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DownloadPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const [timeSeriesId, setTimeSeriesId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const FORMATS = [
    { key: 'XLSX', label: t('download.formats.xlsx.label'), icon: FileSpreadsheet, desc: t('download.formats.xlsx.desc') },
    { key: 'CSV', label: t('download.formats.csv.label'), icon: FileText, desc: t('download.formats.csv.desc') },
    { key: 'PDF', label: t('download.formats.pdf.label'), icon: FileText, desc: t('download.formats.pdf.desc') },
  ] as const;

  useEffect(() => {
    if (token) setTimeSeriesId('from-token');
  }, [token]);

  const handleDownload = async (format: string) => {
    setDownloading(format);
    setError('');
    try {
      const endpoint = user
        ? `/user/datasets/${timeSeriesId}/download/${format}`
        : `/user/datasets/${timeSeriesId}/download/${format}?token=${token}`;
      const res = await api.get<{ success: boolean; data: { url: string } }>(endpoint);
      window.open(res.data.data.url, '_blank');
    } catch {
      setError(t('download.failed'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.download')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Download className="h-12 w-12 text-brand-blue mx-auto mb-4" aria-hidden />
            <h1 className="text-2xl font-bold text-gray-900">{t('download.title')}</h1>
            <p className="text-gray-500 mt-2">{t('download.subtitle')}</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              {FORMATS.map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => handleDownload(key)}
                  disabled={!!downloading}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <Icon className="h-6 w-6 text-brand-blue flex-shrink-0" aria-hidden />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                  {downloading === key ? (
                    <span className="text-sm text-brand-blue">{t('download.preparing')}</span>
                  ) : (
                    <Download className="h-4 w-4 text-gray-400" aria-hidden />
                  )}
                </button>
              ))}

              {error && <p className="text-sm text-red-600 text-center" role="alert">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
