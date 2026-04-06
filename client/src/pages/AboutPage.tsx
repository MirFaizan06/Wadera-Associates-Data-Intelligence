import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BarChart3, Globe2, ShieldCheck, TrendingUp, Database, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VALUE_ICONS = [Database, Globe2, ShieldCheck, TrendingUp];
const TEAM_INITIALS = ['F', 'H', 'R'];
const TEAM_PHOTOS = [
  '/team_profile_pics/faizan.jpg',
  '/team_profile_pics/hamid.jpg',
  '/team_profile_pics/rauf.jpg',
];

export default function AboutPage() {
  const { t } = useTranslation();

  const values = t('about.offer.values', { returnObjects: true }) as { title: string; desc: string }[];
  const members = t('about.team.members', { returnObjects: true }) as { name: string; role: string; bio: string }[];

  return (
    <>
      <Helmet>
        <title>{t('titles.about')}</title>
        <meta name="description" content="ARW Analytics is a data intelligence platform providing high-quality business, sector, and industry datasets to a global clientele." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/about" />
        <meta property="og:title" content="About ARW Analytics — Data Intelligence" />
        <meta property="og:description" content="A data intelligence platform providing high-quality business, sector, and industry datasets to a global clientele." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/about" />
        <meta property="og:site_name" content="ARW Analytics" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="About ARW Analytics — Data Intelligence" />
        <meta name="twitter:description" content="A data intelligence platform providing high-quality business, sector, and industry datasets to a global clientele." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
      </Helmet>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-20">
        <div className="container max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-blue/20 p-4 rounded-2xl">
              <BarChart3 className="h-12 w-12 text-brand-blue" aria-hidden />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
            {t('about.heroTitle1')} <span className="text-brand-blue">{t('about.heroTitle2')}</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('about.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-3">{t('about.mission.badge')}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-5">
            {t('about.mission.title')}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {t('about.mission.body')}
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-3">{t('about.offer.badge')}</p>
            <h2 className="text-3xl font-bold text-gray-900">{t('about.offer.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <div key={v.title} className="flex gap-5">
                  <div className="shrink-0 mt-1">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <Icon className="h-5 w-5 text-brand-blue" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1.5">{v.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team illustration */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container max-w-3xl">
          <img
            src="/images/About_Page_Hero_Illustration.webp"
            alt={t('about.teamIllustrationAlt')}
            className="w-full max-w-2xl mx-auto rounded-2xl shadow-sm"
            width={700}
            height={280}
            loading="lazy"
          />
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-3">{t('about.team.badge')}</p>
            <h2 className="text-3xl font-bold text-gray-900">{t('about.team.title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
              {t('about.team.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {members.map((member, idx) => (
              <div key={member.name} className="text-center group">
                <div className="relative mx-auto w-28 h-28 mb-5">
                  <img
                    src={TEAM_PHOTOS[idx]}
                    alt={member.name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-md border-2 border-gray-100"
                    onError={e => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-navy flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-gray-100 absolute inset-0"
                    style={{ display: 'none' }}
                    aria-hidden
                  >
                    {TEAM_INITIALS[idx]}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm font-medium text-brand-blue mb-3">{member.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed px-2">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structure */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-3">{t('about.structure.badge')}</p>
            <h2 className="text-3xl font-bold text-gray-900">{t('about.structure.title')}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5 text-gray-600 text-sm leading-relaxed">
            <p>{t('about.structure.p1')}</p>
            <p>{t('about.structure.p2')}</p>
            <p>{t('about.structure.p3')}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-navy text-white text-center">
        <div className="container max-w-2xl">
          <Users className="h-10 w-10 text-brand-blue mx-auto mb-4" aria-hidden />
          <h2 className="text-2xl font-bold mb-3">{t('about.cta.title')}</h2>
          <p className="text-gray-300 mb-6 text-sm">
            {t('about.cta.subtitle')}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            {t('about.cta.btn')}
          </Link>
        </div>
      </section>
    </>
  );
}
