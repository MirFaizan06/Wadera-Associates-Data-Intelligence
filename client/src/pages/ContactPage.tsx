import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import { CheckCircle, Mail, Clock } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.post('/public/contact', data);
    setSubmitted(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('titles.contact')}</title>
        <meta name="description" content="Contact ARW Analytics for dataset inquiries, custom data requests, partnership proposals, or support. We typically respond within 1–2 business days." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/contact" />
        <meta property="og:title" content="Contact ARW Analytics" />
        <meta property="og:description" content="Get in touch for dataset inquiries, support, or partnerships." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/contact" />
        <meta property="og:site_name" content="ARW Analytics" />
        <meta property="og:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact ARW Analytics" />
        <meta name="twitter:description" content="Get in touch for dataset inquiries, support, or partnerships." />
        <meta name="twitter:image" content="https://wa-data-intel.netlify.app/images/logo.webp" />
      </Helmet>

      {/* Header */}
      <div className="bg-brand-navy py-14 text-white">
        <div className="container">
          <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">{t('contact.badge')}</p>
          <h1 className="text-4xl font-extrabold mb-3">{t('contact.title')}</h1>
          <p className="text-blue-200 max-w-lg text-sm">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen py-14">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-12 items-start max-w-5xl mx-auto">

            {/* Left — illustration + info */}
            <div className="w-full lg:w-2/5 flex flex-col gap-8">
              <img
                src="/images/Contact_Page_Illustration.webp"
                alt="Contact us illustration"
                className="w-full max-w-sm mx-auto lg:mx-0 rounded-2xl shadow-sm"
                width={480}
                height={240}
                loading="lazy"
              />
              <div className="space-y-5 px-1">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-blue-50 rounded-lg shrink-0">
                    <Mail className="h-4 w-4 text-brand-blue" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('contact.emailLabel')}</p>
                    <a href="mailto:contact@waderaassociates.com" className="text-sm text-brand-blue hover:underline">
                      contact@waderaassociates.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-blue-50 rounded-lg shrink-0">
                    <Clock className="h-4 w-4 text-brand-blue" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('contact.responseLabel')}</p>
                    <p className="text-sm text-gray-500">{t('contact.responseTime')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="w-full lg:w-3/5">
              {submitted ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" aria-hidden />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('contact.success.title')}</h2>
                    <p className="text-gray-500 text-sm">{t('contact.success.body')}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                      <Input id="name" label={t('contact.form.fullName')} placeholder={t('contact.form.namePlaceholder')} error={errors.name?.message} {...register('name')} />
                      <Input id="email" type="email" label={t('contact.form.email')} placeholder={t('contact.form.emailPlaceholder')} error={errors.email?.message} {...register('email')} />
                      <Input id="subject" label={t('contact.form.subject')} placeholder={t('contact.form.subjectPlaceholder')} error={errors.subject?.message} {...register('subject')} />
                      <div className="space-y-1">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t('contact.form.message')}</label>
                        <textarea
                          id="message"
                          rows={5}
                          placeholder={t('contact.form.messagePlaceholder')}
                          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                          aria-invalid={!!errors.message}
                          {...register('message')}
                        />
                        {errors.message && <p className="text-xs text-red-600" role="alert">{errors.message.message}</p>}
                      </div>
                      <Button type="submit" className="w-full" loading={isSubmitting}>{t('contact.form.sendBtn')}</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
