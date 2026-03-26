import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Calendar, Tag, Globe, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Dataset, DataPoint } from '@/types';
import PaymentModal from '@/components/payment/PaymentModal';


interface DetailResponse {
  success: boolean;
  data: {
    dataset: Dataset & { dataPoints: DataPoint[] };
    exchangeRates: Record<string, number>;
    availableConversions: string[];
  };
}

export default function DatasetDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [data, setData] = useState<DetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { formatAmount } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    if (!slug) return;
    api.get<DetailResponse>(`/public/datasets/${slug}?includeData=true`)
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!data) return <div className="container py-20 text-center text-gray-500">{t('datasetDetail.notFound')}</div>;

  const { dataset } = data;
  const chartData = dataset.dataPoints?.slice(-60).map(dp => ({
    date: dp.date.slice(0, 7),
    value: dp.value,
  })) || [];

  const previewData = dataset.dataPoints?.slice(0, 5) || [];

  return (
    <>
      <Helmet>
        <title>{dataset.name} - Wadera Associates</title>
        <meta name="description" content={dataset.description || `Download ${dataset.name} time-series dataset.`} />
        <link rel="canonical" href={`https://waderaassociates.com/datasets/${dataset.slug}`} />
        <meta property="og:title" content={`${dataset.name} — Wadera Associates`} />
        <meta property="og:description" content={dataset.description || `Download ${dataset.name} time-series dataset in XLSX, CSV, or PDF.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://waderaassociates.com/datasets/${dataset.slug}`} />
        <meta property="og:site_name" content="Wadera Associates" />
        <meta property="og:image" content={dataset.coverImage || 'https://waderaassociates.com/images/logo.webp'} />
        <meta name="twitter:card" content={dataset.coverImage ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`${dataset.name} — Wadera Associates`} />
        <meta name="twitter:description" content={dataset.description || `Download ${dataset.name} time-series dataset.`} />
        <meta name="twitter:image" content={dataset.coverImage || 'https://waderaassociates.com/images/logo.webp'} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: dataset.name,
          description: dataset.description,
          url: `https://waderaassociates.com/datasets/${dataset.slug}`,
          creator: { '@type': 'Organization', name: 'Wadera Associates', url: 'https://waderaassociates.com' },
          variableMeasured: dataset.defaultUnit,
          ...(dataset.category && { keywords: [dataset.category] }),
          distribution: [
            { '@type': 'DataDownload', encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'XLSX' },
            { '@type': 'DataDownload', encodingFormat: 'text/csv', name: 'CSV' },
            { '@type': 'DataDownload', encodingFormat: 'application/pdf', name: 'PDF' },
          ],
        })}</script>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-brand-navy text-white py-12">
          <div className="container">
            {dataset.category && (
              <span className="inline-block text-xs bg-blue-700 text-blue-200 px-2 py-1 rounded mb-3">
                {dataset.category}
              </span>
            )}
            <h1 className="text-3xl font-bold mb-3">{dataset.name}</h1>
            {dataset.description && <p className="text-blue-200 max-w-2xl">{dataset.description}</p>}
            <div className="flex flex-wrap gap-4 mt-6 text-sm text-blue-300">
              {dataset.region && <span className="flex items-center gap-1"><Globe className="h-4 w-4" aria-hidden />{dataset.region}</span>}
              {dataset.source && <span className="flex items-center gap-1"><FileText className="h-4 w-4" aria-hidden />{t('datasetDetail.sourceLabel')} {dataset.source}</span>}
              <span className="flex items-center gap-1"><Tag className="h-4 w-4" aria-hidden />{t('datasetDetail.unitLabel')} {dataset.defaultUnit}</span>
            </div>
          </div>
        </div>

        <div className="container py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('datasetDetail.chart.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(v: number) => [v.toFixed(2), dataset.defaultUnit]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="value" name={dataset.defaultUnit} stroke="#2B6CB0" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400">{t('datasetDetail.chart.noData')}</div>
                )}
              </CardContent>
            </Card>

            {/* Preview table */}
            {previewData.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t('datasetDetail.preview.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('datasetDetail.preview.dateCol')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('datasetDetail.preview.valueCol')}</th>
                          <th className="text-left py-2 font-medium text-gray-600">{t('datasetDetail.preview.unitCol')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((dp, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 pr-4 text-gray-700">{dp.date.slice(0, 7)}</td>
                            <td className="py-2 pr-4 font-mono text-gray-900">{dp.value}</td>
                            <td className="py-2 text-gray-500">{dp.unitOverride || dataset.defaultUnit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-3">{t('datasetDetail.preview.purchaseNote', { count: dataset._count?.dataPoints || 0 })}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase card */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-brand-navy mb-1">
                  {formatAmount(dataset.priceINR)}
                </div>
                <p className="text-sm text-gray-500 mb-6">{t('datasetDetail.purchase.lifetime')}</p>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Download className="h-4 w-4 text-green-500" aria-hidden />
                    {t('datasetDetail.purchase.downloads')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-green-500" aria-hidden />
                    {t('datasetDetail.purchase.dataPoints', { count: dataset._count?.dataPoints || 0 })}
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={() => setPaymentOpen(true)}>
                  {t('datasetDetail.purchase.btn')}
                </Button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  {t('datasetDetail.purchase.secure')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal
          dataset={dataset}
          onClose={() => setPaymentOpen(false)}
          user={user}
        />
      )}
    </>
  );
}
