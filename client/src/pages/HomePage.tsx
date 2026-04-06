import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search, ArrowRight, TrendingUp, Zap, Globe, ShieldCheck,
  BarChart2, Database, Layers, ChevronRight, Flame,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import type { Dataset } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DatasetCard from '@/components/datasets/DatasetCard';

// ── Category tiles ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Energy', icon: Zap, color: 'bg-amber-50 text-amber-600 border-amber-100', q: 'Energy' },
  { label: 'Oil & Gas', icon: Flame, color: 'bg-orange-50 text-orange-600 border-orange-100', q: 'Oil' },
  { label: 'Commodities', icon: TrendingUp, color: 'bg-green-50 text-green-600 border-green-100', q: 'Commodity' },
  { label: 'Finance', icon: BarChart2, color: 'bg-blue-50 text-blue-600 border-blue-100', q: 'Finance' },
  { label: 'Global Markets', icon: Globe, color: 'bg-purple-50 text-purple-600 border-purple-100', q: 'Global' },
  { label: 'All Datasets', icon: Database, color: 'bg-gray-50 text-gray-600 border-gray-200', q: '' },
] as const;

// ── Platform stats ─────────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { value: 'XLSX · CSV · PDF · PNG', label: 'Download Formats' },
  { value: '8+', label: 'Sectors Covered' },
  { value: '8', label: 'Currencies Supported' },
  { value: '100%', label: 'Instant Access' },
];

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  { icon: ShieldCheck, title: 'Verified Data', desc: 'Sourced and cross-checked before publication' },
  { icon: Zap, title: 'Instant Access', desc: 'Download in XLSX, CSV, PDF or PNG immediately' },
  { icon: Globe, title: 'Global Reach', desc: 'Asia, Middle East, and global market coverage' },
  { icon: TrendingUp, title: 'Monthly Updates', desc: 'Datasets refreshed regularly with new data' },
];

const HOW_IT_WORKS_IMAGES = [
  '/images/Browse_and_Discover.webp',
  '/images/Purchase_Securely.webp',
  '/images/Download_and_Use.webp',
];

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get<{ success: boolean; data: Dataset[] }>('/public/datasets/featured')
      .then(res => setFeatured(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/datasets${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  const howItWorksSteps = t('home.howItWorks.steps', { returnObjects: true }) as { title: string; desc: string }[];

  return (
    <>
      <Helmet>
        <title>{t('titles.home')}</title>
        <meta name="description" content="Buy time-series datasets for energy, commodities, and financial markets. Oil prices, electricity rates, commodity indices — instant XLSX, CSV &amp; PDF downloads. One-time purchase, no subscription." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/" />
        <meta property="og:title" content="ARW Analytics — Premium Data Intelligence Platform" />
        <meta property="og:description" content="Buy time-series datasets for energy, commodities and financial markets. Instant XLSX, CSV &amp; PDF downloads. One-time purchase, no subscription." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/" />
        <meta property="og:site_name" content="ARW Analytics" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ARW Analytics — Premium Data Intelligence Platform" />
        <meta name="twitter:description" content="Buy time-series datasets for energy, commodities and financial markets. Instant downloads. No subscription." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What types of datasets does ARW Analytics sell?',
              acceptedAnswer: { '@type': 'Answer', text: 'We offer time-series datasets for energy markets (oil, gas, electricity), commodity prices, and financial market indicators. Data is available for instant download in XLSX, CSV, PDF, and PNG formats.' },
            },
            {
              '@type': 'Question',
              name: 'Do I need a subscription to access datasets?',
              acceptedAnswer: { '@type': 'Answer', text: 'No. ARW Analytics uses a one-time purchase model — pay once, download immediately, and retain lifetime access. No recurring fees or subscriptions required.' },
            },
            {
              '@type': 'Question',
              name: 'What currencies are supported for payment?',
              acceptedAnswer: { '@type': 'Answer', text: 'Prices are displayed in 8 currencies including USD, EUR, GBP, INR, PKR, SAR, AED, and JPY. Payments are processed securely through Razorpay.' },
            },
            {
              '@type': 'Question',
              name: 'Are there free resources available?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. Our Free Data section provides freely accessible articles, reports, and downloadable PDFs on energy markets, commodity pricing, and economic data — no account required.' },
            },
          ],
        })}</script>
      </Helmet>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-16 md:py-20 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-brand-blue uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-6">
              <Layers className="h-3.5 w-3.5" aria-hidden /> Premium Data Intelligence
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-navy leading-[1.1] tracking-tight mb-5">
              The Data Platform<br />
              <span className="text-brand-blue">for Smart Decisions</span>
            </h1>

            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
              Time-series datasets for energy, commodities, and financial markets.
              Browse, purchase, and download instantly — no subscription needed.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6">
              <div className="flex items-center bg-white rounded-2xl border-2 border-gray-200 focus-within:border-brand-blue shadow-sm hover:shadow-md transition-all overflow-hidden">
                <Search className="h-5 w-5 text-gray-400 ml-4 shrink-0" aria-hidden />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search datasets — oil prices, electricity, commodities…"
                  className="flex-1 px-3 py-4 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                  aria-label="Search datasets"
                />
                <button
                  type="submit"
                  className="m-1.5 px-5 py-2.5 bg-brand-blue hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick-browse pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Oil Prices', 'Electricity Rates', 'Commodity Index', 'Natural Gas'].map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => navigate(`/datasets?q=${encodeURIComponent(term)}`)}
                  className="px-3 py-1 text-xs text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-brand-blue border border-gray-200 hover:border-blue-200 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM STATS BAR ──────────────────────────────────────────────── */}
      <div className="bg-brand-navy text-white">
        <div className="container py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-blue-800">
            {PLATFORM_STATS.map((s, i) => (
              <div key={i} className="text-center px-4 py-2">
                <p className="font-extrabold text-lg sm:text-xl text-white leading-none">{s.value}</p>
                <p className="text-blue-300 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BROWSE BY CATEGORY ──────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 border-b border-gray-100" aria-labelledby="categories-heading">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-1">Browse Topics</p>
              <h2 id="categories-heading" className="text-2xl font-bold text-brand-navy">Explore by Sector</h2>
            </div>
            <Button variant="link" asChild className="text-brand-blue hidden sm:flex">
              <Link to="/datasets">View All <ChevronRight className="h-4 w-4 ml-1" aria-hidden /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  to={`/datasets${cat.q ? `?category=${encodeURIComponent(cat.q)}` : ''}`}
                  className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border ${cat.color} hover:shadow-md transition-all group`}
                >
                  <div className="h-11 w-11 rounded-xl bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED DATASETS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white" aria-labelledby="featured-heading">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-1">Curated Selection</p>
              <h2 id="featured-heading" className="text-2xl font-bold text-brand-navy">{t('home.featured.title')}</h2>
            </div>
            <Button variant="link" asChild className="text-brand-blue">
              <Link to="/datasets">{t('home.featured.viewAll')} <ChevronRight className="h-4 w-4 ml-1" aria-hidden /></Link>
            </Button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map(dataset => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
              {featured.length === 0 && (
                <p className="text-gray-400 col-span-3 text-center py-12">{t('home.featured.empty')}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── DATA COVERAGE + FEATURES STRIP ─────────────────────────────────── */}
      <section className="py-14 bg-blue-50 border-y border-blue-100">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">Coverage</p>
              <h2 className="text-2xl font-bold text-brand-navy mb-3">Data Across Key Sectors</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                ARW Analytics publishes time-series datasets covering energy markets, oil and gas prices, electricity tariffs, commodity indices, and financial market indicators — spanning Asia, the Middle East, and global markets. All datasets are structured for immediate use in models, reports, and dashboards.
              </p>
              <Button asChild className="bg-brand-navy hover:bg-blue-900 text-white">
                <Link to="/datasets">Explore Full Catalog <ArrowRight className="h-4 w-4 ml-2" aria-hidden /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FEATURE_CARDS.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <Icon className="h-5 w-5 text-brand-blue mb-3" aria-hidden />
                    <p className="font-semibold text-gray-900 text-sm mb-1">{f.title}</p>
                    <p className="text-xs text-gray-500 leading-snug">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white" aria-labelledby="how-heading">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">{t('home.howItWorks.badge')}</p>
            <h2 id="how-heading" className="text-3xl font-bold text-brand-navy">{t('home.howItWorks.title')}</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-6 w-36 h-36">
                  <span className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-full h-full rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-4 hover:bg-blue-100 transition-colors">
                    <img src={HOW_IT_WORKS_IMAGES[i]} alt={step.title} className="w-full h-full object-contain" width={128} height={128} loading="lazy" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE DATA CALLOUT ───────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border border-gray-200 rounded-2xl px-8 py-7 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">No Account Required</p>
              <h3 className="text-xl font-bold text-brand-navy">Explore Free Data &amp; Resources</h3>
              <p className="text-gray-400 text-sm mt-1">Articles, reports, and PDF downloads on energy markets — completely free.</p>
            </div>
            <Button variant="outline" asChild className="shrink-0 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white transition-colors">
              <Link to="/free-data">{t('home.hero.freeDataBtn')} <ArrowRight className="h-4 w-4 ml-2" aria-hidden /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-brand-navy py-20 text-white text-center">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-blue-300 uppercase mb-4">Get Started Today</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">{t('home.cta.title')}</h2>
            <p className="text-blue-300 mb-8 max-w-md mx-auto text-sm leading-relaxed">{t('home.cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="bg-brand-blue hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40">
                <Link to="/auth/register">{t('home.cta.primaryBtn')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <Link to="/datasets">{t('home.cta.secondaryBtn')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
