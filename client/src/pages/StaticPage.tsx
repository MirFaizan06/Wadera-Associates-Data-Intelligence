import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; content: string; metaTitle?: string; metaDesc?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get<{ success: boolean; data: typeof page }>(`/public/pages/${slug}`)
      .then(res => setPage(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!page) return <div className="container py-20 text-center text-gray-500">Page not found.</div>;

  return (
    <>
      <Helmet>
        <title>{page.metaTitle || page.title} - Wadera Associates</title>
        {page.metaDesc && <meta name="description" content={page.metaDesc} />}
        <link rel="canonical" href={`https://wa-data-intel.netlify.app/pages/${slug}`} />
      </Helmet>
      <div className="py-16 bg-gray-50 min-h-screen">
        <div className="container max-w-3xl">
          <article
            className="prose prose-lg max-w-none bg-white rounded-xl p-8 shadow-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
          />
        </div>
      </div>
    </>
  );
}
