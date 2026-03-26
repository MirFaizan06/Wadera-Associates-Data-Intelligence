import { Link } from 'react-router-dom';
import { Calendar, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Dataset } from '@/types';
import { truncate } from '@/lib/utils';

interface Props { dataset: Dataset; }

export default function DatasetCard({ dataset }: Props) {
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();

  return (
    <article>
      <Link to={`/datasets/${dataset.slug}`} className="block group">
        <Card className="h-full hover:shadow-md transition-shadow group-hover:border-brand-blue/30 overflow-hidden">
          {/* Thumbnail */}
          <div className="relative h-36 bg-gray-50 overflow-hidden">
            {dataset.coverImage ? (
              <img
                src={dataset.coverImage}
                alt={dataset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <img
                src="/images/Dataset_Placeholder.webp"
                alt=""
                className="w-full h-full object-cover opacity-80"
                width={400}
                height={144}
                loading="lazy"
                aria-hidden
              />
            )}
            {dataset.category && (
              <span className="absolute top-2 left-2 text-xs font-medium text-brand-blue bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                {dataset.category}
              </span>
            )}
          </div>

          <CardContent className="pt-4">
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-blue transition-colors leading-snug">
              {dataset.name}
            </h3>
            {dataset.description && (
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                {truncate(dataset.description, 100)}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" aria-hidden />
                {t('datasetCard.dataPoints', { count: dataset._count?.dataPoints ?? 0 })}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden />
                {dataset.defaultUnit}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-brand-navy text-lg">
                {formatAmount(dataset.priceINR)}
              </span>
              <span className="text-xs text-brand-blue font-medium group-hover:underline">{t('datasetCard.view')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
}
