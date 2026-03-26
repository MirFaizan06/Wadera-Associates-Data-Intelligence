import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import DatasetCard from '@/components/datasets/DatasetCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import type { Dataset } from '@/types';

interface DatasetsResponse {
  success: boolean;
  data: {
    datasets: Dataset[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    exchangeRates: Record<string, number>;
  };
}

export default function DatasetsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sortBy') || 'createdAt';

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        ...(search && { search }),
        ...(category && { category }),
        sortBy,
        order: 'desc',
      });
      const res = await api.get<DatasetsResponse>(`/public/datasets?${params}`);
      setDatasets(res.data.data.datasets);
      setPagination(res.data.data.pagination);
    } catch { /* handled by error boundary */ }
    finally { setLoading(false); }
  }, [page, search, category, sortBy]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  useEffect(() => {
    api.get<{ success: boolean; data: string[] }>('/public/datasets/categories')
      .then(res => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k));
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.datasets')}</title>
        <meta name="description" content="Browse and buy premium time-series datasets for energy markets, oil prices, electricity rates, commodity indices, and financial indicators. Filter by category, instant download in XLSX, CSV, PDF." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/datasets" />
        <meta property="og:title" content="Browse Datasets — Wadera Associates" />
        <meta property="og:description" content="Premium time-series datasets for energy, commodities, and financial markets." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/datasets" />
        <meta property="og:site_name" content="Wadera Associates" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Browse Datasets — Wadera Associates" />
        <meta name="twitter:description" content="Premium time-series datasets for energy, commodities, and financial markets." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-brand-navy py-12 text-white">
          <div className="container">
            <h1 className="text-3xl font-bold mb-2">{t('datasets.pageTitle')}</h1>
            <p className="text-blue-200">{t('datasets.pageSubtitle')}</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
              <input
                type="search"
                placeholder={t('datasets.searchPlaceholder')}
                value={search}
                onChange={e => updateParams({ search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label={t('datasets.searchPlaceholder')}
              />
            </div>
            <select
              value={category}
              onChange={e => updateParams({ category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              aria-label="Filter by category"
            >
              <option value="">{t('datasets.allCategories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => updateParams({ sortBy: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              aria-label="Sort by"
            >
              <option value="createdAt">{t('datasets.sort.newest')}</option>
              <option value="name">{t('datasets.sort.nameAZ')}</option>
              <option value="priceINR">{t('datasets.sort.priceLow')}</option>
            </select>
          </div>

          <div className="text-sm text-gray-500 mb-4">{t('datasets.found', { count: pagination.total })}</div>

          {loading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map(d => <DatasetCard key={d.id} dataset={d} />)}
              </div>
              {datasets.length === 0 && (
                <div className="col-span-3 flex flex-col items-center py-16">
                  <img
                    src="/images/No_Results_Found.webp"
                    alt={t('datasets.noResults.heading')}
                    className="w-48 sm:w-64 mb-6"
                    width={280}
                    height={210}
                    loading="lazy"
                  />
                  <p className="text-gray-600 font-medium mb-1">{t('datasets.noResults.heading')}</p>
                  <p className="text-sm text-gray-400">{t('datasets.noResults.sub')}</p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <Button
                    variant="outline" size="sm"
                    disabled={page <= 1}
                    onClick={() => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(page - 1)); return n; })}
                    aria-label="Previous page"
                  >{t('datasets.prev')}</Button>
                  <span className="px-4 py-2 text-sm text-gray-600">{page} / {pagination.totalPages}</span>
                  <Button
                    variant="outline" size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(page + 1)); return n; })}
                    aria-label="Next page"
                  >{t('datasets.next')}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
