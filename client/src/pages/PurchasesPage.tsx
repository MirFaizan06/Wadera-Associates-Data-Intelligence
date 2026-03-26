import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import type { Purchase } from '@/types';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function PurchasesPage() {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    api.get<{ success: boolean; data: { purchases: Purchase[] } }>('/user/purchases')
      .then(res => setPurchases(res.data.data.purchases))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>{t('titles.purchases')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('purchases.title')}</h1>
          {loading ? <LoadingSpinner /> : purchases.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <img
                src="/images/No_Purchases_Yet.webp"
                alt="No purchases yet"
                className="w-48 sm:w-64 mb-6"
                width={280}
                height={210}
                loading="lazy"
              />
              <p className="text-gray-700 font-medium mb-1">{t('purchases.empty.title')}</p>
              <p className="text-sm text-gray-400 mb-6">{t('purchases.empty.subtitle')}</p>
              <Button asChild><Link to="/datasets">{t('purchases.empty.browseBtn')}</Link></Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map(p => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.timeSeries.name}</h3>
                      <p className="text-sm text-gray-500">{formatDate(p.purchasedAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-navy">{formatAmount(p.amountINR)}</div>
                      <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link to={`/datasets/${p.timeSeries.slug}`}>{t('purchases.downloadBtn')}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
