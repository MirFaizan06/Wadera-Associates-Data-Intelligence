import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Download, Shield, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import type { Dataset } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DatasetCard from '@/components/datasets/DatasetCard';

const FEATURE_ICONS = [BarChart3, Download, Shield, TrendingUp];

const HOW_IT_WORKS_IMAGES = [
  '/images/Browse_and_Discover.webp',
  '/images/Purchase_Securely.webp',
  '/images/Download_and_Use.webp',
];

// Hero background images — add more PNGs to public/homepage_hero_imgs/ and they auto-populate
const HERO_IMAGE_COUNT = 5;
const HERO_IMAGES = Array.from({ length: HERO_IMAGE_COUNT }, (_, i) => `/homepage_hero_imgs/${i + 1}.png`);

export default function HomePage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordIdx, setWordIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [bgIdx, setBgIdx] = useState(0);
  const [bgFading, setBgFading] = useState(false);
  const bgTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const typewriterWords = t('home.hero.typewriter', { returnObjects: true }) as string[];

  useEffect(() => {
    api.get<{ success: boolean; data: Dataset[] }>('/public/datasets/featured')
      .then(res => setFeatured(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % typewriterWords.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, [typewriterWords.length]);

  // Hero background slideshow — infinite loop
  useEffect(() => {
    bgTimer.current = setInterval(() => {
      setBgFading(true);
      setTimeout(() => {
        setBgIdx(i => (i + 1) % HERO_IMAGES.length);
        setBgFading(false);
      }, 600);
    }, 4500);
    return () => { if (bgTimer.current) clearInterval(bgTimer.current); };
  }, []);

  const howItWorksSteps = t('home.howItWorks.steps', { returnObjects: true }) as { title: string; desc: string }[];
  const featureItems = t('home.features.items', { returnObjects: true }) as { title: string; desc: string }[];

  return (
    <>
      <Helmet>
        <title>{t('titles.home')}</title>
        <meta name="description" content="Buy time-series datasets for energy, commodities, and financial markets. Oil prices, electricity rates, commodity indices — instant XLSX, CSV &amp; PDF downloads. One-time purchase, no subscription." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/" />
        <meta property="og:title" content="Wadera Associates — Premium Data Intelligence Platform" />
        <meta property="og:description" content="Buy time-series datasets for energy, commodities and financial markets. Instant XLSX, CSV &amp; PDF downloads. One-time purchase, no subscription." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/" />
        <meta property="og:site_name" content="Wadera Associates" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wadera Associates — Premium Data Intelligence Platform" />
        <meta name="twitter:description" content="Buy time-series datasets for energy, commodities and financial markets. Instant XLSX, CSV &amp; PDF downloads. No subscription." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What types of datasets does Wadera Associates sell?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We offer time-series datasets for energy markets (oil, gas, electricity), commodity prices, and financial market indicators. Data is available for instant download in XLSX, CSV, PDF, and PNG formats.',
              },
            },
            {
              '@type': 'Question',
              name: 'Do I need a subscription to access datasets?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Wadera Associates uses a one-time purchase model — pay once, download immediately, and retain lifetime access. No recurring fees or subscriptions required.',
              },
            },
            {
              '@type': 'Question',
              name: 'What currencies are supported for payment?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Prices are displayed in 8 currencies including USD, EUR, GBP, INR, PKR, SAR, AED, and JPY. Payments are processed securely through Razorpay.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are there free resources available?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Our Free Data section provides freely accessible articles, reports, and downloadable PDFs on energy markets, commodity pricing, and economic data — no account required.',
              },
            },
          ],
        })}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '420px' }}>
        {/* Background image slideshow */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === bgIdx ? (bgFading ? 0 : 1) : 0,
            }}
            aria-hidden
          />
        ))}
        {/* Dark overlay — strong enough to keep text readable over any image */}
        <div className="absolute inset-0 bg-brand-navy/75" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30" aria-hidden />
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '36px 36px' }}
          aria-hidden
        />

        <div className="container relative py-16 md:py-20 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <p className="inline-block text-xs font-semibold tracking-widest text-blue-300 uppercase mb-4 bg-blue-800/50 px-4 py-1.5 rounded-full border border-blue-700/60">
              {t('home.hero.badge')}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-3 tracking-tight">
              {t('home.hero.title1')}<br />
              <span className="text-blue-300">{t('home.hero.title2')}</span>
            </h1>

            {/* Typewriter line */}
            <div className="h-9 sm:h-10 flex items-center justify-center mb-5">
              <p className="text-lg sm:text-xl md:text-2xl text-blue-200">
                For{' '}
                <span
                  className="font-bold text-white border-b-2 border-brand-blue pb-0.5"
                  style={{ transition: 'opacity 0.35s ease', opacity: visible ? 1 : 0 }}
                >
                  {typewriterWords[wordIdx]}
                </span>
              </p>
            </div>

            <p className="text-base sm:text-lg text-blue-200 max-w-xl mx-auto mb-8 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="bg-white text-brand-navy hover:bg-blue-50 shadow-lg shadow-blue-900/30">
                <Link to="/datasets">
                  {t('home.hero.browseBtn')} <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/50 bg-transparent text-white hover:bg-white/10">
                <Link to="/free-data">{t('home.hero.freeDataBtn')}</Link>
              </Button>
            </div>

            {/* Slideshow dots */}
            <div className="flex justify-center gap-1.5 mt-6" aria-hidden>
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setBgIdx(i); setBgFading(false); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === bgIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                  tabIndex={-1}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container py-5">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 md:gap-x-16">
            <div className="text-center">
              <p className="font-extrabold text-brand-navy text-lg sm:text-xl leading-none">XLSX · CSV · PDF · PNG</p>
              <p className="text-gray-400 text-xs mt-1">{t('home.stats.formatsLabel')}</p>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-brand-navy text-lg sm:text-xl leading-none">{t('home.stats.sectorsValue')}</p>
              <p className="text-gray-400 text-xs mt-1">{t('home.stats.sectorsLabel')}</p>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-brand-navy text-lg sm:text-xl leading-none">{t('home.stats.currenciesValue')}</p>
              <p className="text-gray-400 text-xs mt-1">{t('home.stats.currenciesLabel')}</p>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-brand-navy text-lg sm:text-xl leading-none">{t('home.stats.accessValue')}</p>
              <p className="text-gray-400 text-xs mt-1">{t('home.stats.accessLabel')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <section className="py-20 bg-white" aria-labelledby="how-heading">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">{t('home.howItWorks.badge')}</p>
            <h2 id="how-heading" className="text-3xl font-bold text-brand-navy">{t('home.howItWorks.title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="relative mb-6 w-40 h-40 flex items-center justify-center">
                  <span className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-full h-full rounded-2xl bg-blue-50 flex items-center justify-center p-4 group-hover:bg-blue-100 transition-colors">
                    <img src={HOW_IT_WORKS_IMAGES[i]} alt={step.title} className="w-full h-full object-contain" width={140} height={140} loading="lazy" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 bg-gray-50" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="text-3xl font-bold text-center text-brand-navy mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureItems.map((item, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <Card key={i} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-brand-blue" aria-hidden />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Data Coverage ── */}
      <section className="py-14 bg-white border-t border-gray-100" aria-labelledby="coverage-heading">
        <div className="container max-w-3xl text-center">
          <h2 id="coverage-heading" className="text-2xl font-bold text-brand-navy mb-4">{t('home.coverage.title')}</h2>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{t('home.coverage.body')}</p>
        </div>
      </section>

      {/* ── Featured Datasets ── */}
      <section className="py-16 bg-white" aria-labelledby="featured-heading">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 id="featured-heading" className="text-2xl font-bold text-brand-navy">{t('home.featured.title')}</h2>
            <Button variant="link" asChild>
              <Link to="/datasets">{t('home.featured.viewAll')} <ChevronRight className="h-4 w-4 ml-1" aria-hidden /></Link>
            </Button>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(dataset => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
              {featured.length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-8">{t('home.featured.empty')}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-navy py-16 text-white text-center">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="bg-brand-blue hover:bg-blue-700 text-white">
              <Link to="/auth/register">{t('home.cta.primaryBtn')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/50 bg-transparent text-white hover:bg-white/10">
              <Link to="/datasets">{t('home.cta.secondaryBtn')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
