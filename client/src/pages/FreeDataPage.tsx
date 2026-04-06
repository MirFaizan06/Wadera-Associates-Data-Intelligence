import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, Tag, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';

interface FreeResource {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: 'ARTICLE' | 'PDF';
  category: string | null;
  tags: string[] | null;
  author: string | null;
  coverImage: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

interface ListResponse {
  success: boolean;
  data: {
    items: FreeResource[];
    total: number;
    totalPages: number;
    page: number;
  };
}

export default function FreeDataPage() {
  const { t } = useTranslation();
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'ALL' | 'ARTICLE' | 'PDF'>('ALL');
  const [activeCategory, setActiveCategory] = useState('');
  const [total, setTotal] = useState(0);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== 'ALL') params.set('type', activeType);
      if (activeCategory) params.set('category', activeCategory);
      const res = await api.get<ListResponse>(`/public/free?${params}`);
      setResources(res.data.data.items);
      setTotal(res.data.data.total);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [activeType, activeCategory]);

  useEffect(() => {
    fetchResources();
    api.get<{ success: boolean; data: string[] }>('/public/free/categories')
      .then(r => setCategories(r.data.data))
      .catch(() => {});
  }, [fetchResources]);

  return (
    <>
      <Helmet>
        <title>{t('titles.freeData')}</title>
        <meta name="description" content="Free articles, reports and downloadable data from ARW Analytics covering energy, commodities and financial markets." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/free-data" />
        <meta property="og:title" content="Free Data &amp; Resources — ARW Analytics" />
        <meta property="og:description" content="Free articles, reports and downloadable PDFs on energy, commodities and financial markets." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/free-data" />
        <meta property="og:site_name" content="ARW Analytics" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Free Data &amp; Resources — ARW Analytics" />
        <meta name="twitter:description" content="Free articles, reports and downloadable PDFs on energy, commodities and financial markets." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
      </Helmet>

      {/* Hero */}
      <section className="bg-brand-navy py-14 overflow-hidden">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-3">{t('freeData.badge')}</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                {t('freeData.title')}
              </h1>
              <p className="text-blue-200 text-base max-w-md mx-auto md:mx-0">
                {t('freeData.subtitle')}
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto max-w-xs sm:max-w-sm">
              <img
                src="/images/Free_Data_Section_Illustration.webp"
                alt="Free data and resources"
                className="w-full rounded-2xl shadow-xl shadow-blue-900/40"
                width={420}
                height={280}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <span className="text-sm font-medium text-gray-600 mr-1">Type:</span>
          {(['ALL', 'ARTICLE', 'PDF'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeType === type
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {type === 'ALL' ? t('freeData.typeAll') : type === 'ARTICLE' ? t('freeData.typeArticles') : t('freeData.typePDFs')}
            </button>
          ))}
          {categories.length > 0 && (
            <>
              <span className="text-sm font-medium text-gray-600 ml-4 mr-1">{t('freeData.categoryLabel')}</span>
              <button
                onClick={() => setActiveCategory('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === '' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue'
                }`}
              >
                {t('freeData.typeAll')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    activeCategory === cat ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </>
          )}
          <span className="ml-auto text-sm text-gray-500">
            {t(total === 1 ? 'freeData.resourceCount_one' : 'freeData.resourceCount_other', { count: total })}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : resources.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('freeData.noResources.title')}</p>
            <p className="text-sm mt-1">{t('freeData.noResources.sub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ResourceCard({ resource: r }: { resource: FreeResource }) {
  const { t } = useTranslation();
  const isPDF = r.type === 'PDF';

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      {r.coverImage && (
        <img src={r.coverImage} alt={r.title} className="w-full h-40 object-cover rounded-t-lg" />
      )}
      <CardContent className="pt-5 flex flex-col flex-1">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPDF ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isPDF ? <Download className="h-3 w-3" aria-hidden /> : <FileText className="h-3 w-3" aria-hidden />}
            {isPDF ? t('freeData.card.pdfBadge') : t('freeData.card.articleBadge')}
          </span>
          {r.category && (
            <span className="text-xs text-gray-500">{r.category}</span>
          )}
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug">
          <Link to={`/free-data/${r.slug}`} className="hover:text-brand-blue transition-colors">
            {r.title}
          </Link>
        </h2>

        {r.summary && (
          <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{r.summary}</p>
        )}

        <div className="mt-auto space-y-3">
          {r.tags && Array.isArray(r.tags) && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(r.tags as string[]).slice(0, 3).map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" aria-hidden /> {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" aria-hidden />
              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {isPDF && r.pdfUrl ? (
              <a
                href={r.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> {t('freeData.card.downloadPDF')}
              </a>
            ) : (
              <Link to={`/free-data/${r.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                {t('freeData.card.read')} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
