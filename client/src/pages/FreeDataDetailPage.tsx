import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Download, Tag, Calendar, ArrowLeft, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';


interface FreeResource {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: 'ARTICLE' | 'PDF';
  content: string | null;
  pdfUrl: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FreeDataDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [resource, setResource] = useState<FreeResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get<{ success: boolean; data: FreeResource }>(`/public/free/${slug}`)
      .then(res => setResource(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (notFound || !resource) {
    return (
      <div className="container py-20 text-center text-gray-500">
        <p className="text-xl font-medium mb-4">{t('freeDataDetail.notFound')}</p>
        <Link to="/free-data" className="text-brand-blue hover:underline text-sm">
          {t('freeDataDetail.back')}
        </Link>
      </div>
    );
  }

  const htmlContent = resource.content
    ? DOMPurify.sanitize(marked(resource.content) as string)
    : '';

  return (
    <>
      <Helmet>
        <title>{resource.title} - Free Data | ARW Analytics</title>
        {resource.summary && <meta name="description" content={resource.summary} />}
        <link rel="canonical" href={`https://wa-data-intel.netlify.app/free-data/${resource.slug}`} />
        <meta property="og:title" content={`${resource.title} — ARW Analytics`} />
        <meta property="og:description" content={resource.summary || resource.title} />
        <meta property="og:type" content={resource.type === 'ARTICLE' ? 'article' : 'website'} />
        <meta property="og:url" content={`https://wa-data-intel.netlify.app/free-data/${resource.slug}`} />
        <meta property="og:site_name" content="ARW Analytics" />
        <meta property="og:image" content={resource.coverImage || 'https://wa-data-intel.netlify.app/images/logo.webp'} />
        <meta name="twitter:card" content={resource.coverImage ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`${resource.title} — ARW Analytics`} />
        <meta name="twitter:description" content={resource.summary || resource.title} />
        <meta name="twitter:image" content={resource.coverImage || 'https://wa-data-intel.netlify.app/images/logo.webp'} />
        {resource.type === 'ARTICLE' && (
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: resource.title,
            description: resource.summary,
            url: `https://wa-data-intel.netlify.app/free-data/${resource.slug}`,
            datePublished: resource.createdAt,
            dateModified: resource.updatedAt,
            author: resource.author
              ? { '@type': 'Person', name: resource.author }
              : { '@type': 'Organization', name: 'ARW Analytics' },
            publisher: { '@type': 'Organization', name: 'ARW Analytics', url: 'https://wa-data-intel.netlify.app' },
            ...(resource.coverImage && { image: resource.coverImage }),
          })}</script>
        )}
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container max-w-3xl">
          {/* Back */}
          <Link
            to="/free-data"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-blue mb-6"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t('freeDataDetail.back')}
          </Link>

          <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover image */}
            {resource.coverImage && (
              <img
                src={resource.coverImage}
                alt={resource.title}
                className="w-full h-56 object-cover"
              />
            )}

            <div className="p-8">
              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  resource.type === 'PDF'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {resource.type === 'PDF' ? t('freeDataDetail.pdfBadge') : t('freeDataDetail.articleBadge')}
                </span>
                {resource.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {resource.category}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
                {resource.title}
              </h1>

              {resource.summary && (
                <p className="text-gray-600 text-base mb-5 leading-relaxed">{resource.summary}</p>
              )}

              {/* Author + date */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
                {resource.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" aria-hidden /> {resource.author}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {new Date(resource.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              {/* PDF download button */}
              {resource.type === 'PDF' && resource.pdfUrl && (
                <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-800 font-medium">
                    {t('freeDataDetail.pdfDesc')}
                  </p>
                  <a
                    href={resource.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700 transition-colors shrink-0"
                  >
                    <Download className="h-4 w-4" aria-hidden /> {t('freeDataDetail.downloadPDF')}
                  </a>
                </div>
              )}

              {/* Markdown content */}
              {htmlContent && (
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}

              {/* Tags */}
              {resource.tags && Array.isArray(resource.tags) && resource.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {(resource.tags as string[]).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      <Tag className="h-3 w-3" aria-hidden /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
