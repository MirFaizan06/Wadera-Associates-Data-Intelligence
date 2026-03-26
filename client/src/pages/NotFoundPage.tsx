import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('titles.notFound')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50">
        <img
          src="/images/404_Page_Illustration.webp"
          alt="Page not found"
          className="w-56 sm:w-72 md:w-80 mb-8"
          width={400}
          height={280}
          loading="eager"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {t('notFound.title')}
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          {t('notFound.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link to="/">{t('notFound.homeBtn')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/datasets">{t('notFound.browseBtn')}</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
