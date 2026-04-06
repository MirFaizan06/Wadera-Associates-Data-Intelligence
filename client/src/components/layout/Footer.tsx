import { Link } from 'react-router-dom';
import { BarChart3, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-navy text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-300" aria-hidden />
              <span className="font-bold text-lg">ARW Analytics</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-blue-200">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/datasets" className="hover:text-white transition-colors">{t('footer.browseDatasets')}</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-blue-200">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/pages/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/pages/terms-of-service" className="hover:text-white transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footer.sitemap')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-blue-200">{t('footer.contactSection')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden /><a href="mailto:info@arwanalytics.com" className="hover:text-white">info@arwanalytics.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
          {t('footer.copyright', { year })}
        </div>
      </div>
    </footer>
  );
}
