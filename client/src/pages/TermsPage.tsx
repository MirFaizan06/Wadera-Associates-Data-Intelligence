import { Helmet } from 'react-helmet-async';

const LAST_UPDATED = 'March 2026';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - ARW Analytics</title>
        <meta name="description" content="Terms of Service governing use of the ARW Analytics Data Intelligence platform." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/pages/terms-of-service" />
        <meta property="og:title" content="Terms of Service — ARW Analytics" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/pages/terms-of-service" />
        <meta property="og:site_name" content="ARW Analytics" />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-16">
        <div className="container max-w-3xl">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">Legal</p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 space-y-8 text-gray-700 text-[15px] leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the ARW Analytics Data Intelligence platform ("Platform") at{' '}
                <strong>waderaassociates.com</strong>, you agree to be bound by these Terms of Service ("Terms").
                If you do not agree to all of these Terms, do not use the Platform.
              </p>
              <p className="mt-3">
                These Terms constitute a legally binding agreement between you ("User") and ARW Analytics
                ("we", "our", or "us"), a data intelligence venture operating under its parent entity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Services</h2>
              <p>
                The Platform provides access to structured business, sector, and industry datasets ("Datasets")
                and free informational resources ("Free Resources"). Datasets are available for purchase under
                specific license terms. Free Resources are provided at no charge for informational purposes.
              </p>
              <p className="mt-3">
                We reserve the right to modify, suspend, or discontinue any part of the Platform at any time
                without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Accounts and Registration</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>You must provide accurate and complete information when registering. Accounts with false information may be suspended.</li>
                <li>You are responsible for maintaining the confidentiality of your password. You are liable for all activity under your account.</li>
                <li>You must be at least 18 years of age to create an account and make purchases.</li>
                <li>One person may not maintain more than one account. Duplicate accounts may be merged or deleted.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Purchases and Payment</h2>
              <p className="mb-3">
                All Dataset purchases are processed via Razorpay. By completing a purchase, you agree to the
                applicable pricing, including any applicable taxes and fees.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>Pricing:</strong> Prices are listed in INR and may be displayed in other currencies using live exchange rates for reference. INR is the billing currency.</li>
                <li><strong>Taxes:</strong> GST and other applicable taxes may be added at checkout depending on your location.</li>
                <li><strong>Order Confirmation:</strong> A purchase confirmation email will be sent upon successful payment.</li>
                <li><strong>Download Links:</strong> After payment, you will receive a time-limited, single-use download link. Links expire as indicated at the time of purchase.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Refund Policy</h2>
              <p>
                Due to the digital and immediately downloadable nature of our products, all sales are
                <strong> final and non-refundable</strong> once a download link has been issued or the file
                has been downloaded.
              </p>
              <p className="mt-3">
                Exceptions may be made at our sole discretion in cases of:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mt-2">
                <li>Duplicate charges due to a technical error.</li>
                <li>A Dataset that is materially different from its description on the Platform.</li>
                <li>Payment deducted but no download link delivered within 24 hours.</li>
              </ul>
              <p className="mt-3">
                Refund requests must be submitted within 7 days of purchase to{' '}
                <a href="mailto:support@waderaassociates.com" className="text-brand-blue hover:underline">
                  support@waderaassociates.com
                </a>{' '}
                with your order details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property and Licensing</h2>
              <p className="mb-3">
                All Datasets, reports, and content published on the Platform are the intellectual property of
                ARW Analytics and are jointly owned by its founding partners. Unauthorised reproduction,
                redistribution, resale, or commercial use is strictly prohibited.
              </p>
              <p className="font-medium text-gray-800 mb-2">Upon purchasing a Dataset, you are granted a:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>Non-exclusive, non-transferable personal or commercial use license</strong> as specified in the license type associated with your purchase.</li>
                <li>You may use the data internally, in research, and in reports — provided you credit ARW Analytics as the source.</li>
                <li>You may <strong>not</strong> resell, sublicense, redistribute, or make the Dataset publicly available in whole or in part.</li>
                <li>You may <strong>not</strong> scrape, reverse-engineer, or systematically download data from the Platform.</li>
              </ul>
              <p className="mt-3">
                Violation of these terms may result in immediate account termination and legal action.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Free Resources</h2>
              <p>
                Free articles and downloadable PDFs published on the Platform are provided for informational
                purposes only. They are subject to the same intellectual property protections as paid content.
                You may share links to Free Resources but may not reproduce or republish the full content
                without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
              <p>
                All Datasets and content are provided <strong>"as is"</strong> without warranties of any kind,
                express or implied. While we strive for accuracy, we do not warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mt-3">
                <li>The data is complete, accurate, or up to date at all times.</li>
                <li>The Platform will be uninterrupted or error-free.</li>
                <li>The data is suitable for any specific purpose or business decision.</li>
              </ul>
              <p className="mt-3">
                You are responsible for verifying the suitability of any data before relying on it for business,
                financial, legal, or other decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, ARW Analytics and its partners shall not
                be liable for any indirect, incidental, special, consequential, or punitive damages arising from
                your use of the Platform, including but not limited to loss of profits, data, or business opportunity —
                even if advised of the possibility of such damages.
              </p>
              <p className="mt-3">
                Our total cumulative liability to you shall not exceed the amount you paid for the specific
                Dataset or service giving rise to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Prohibited Conduct</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Use the Platform for any unlawful purpose.</li>
                <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
                <li>Use automated tools to scrape, crawl, or bulk-download content.</li>
                <li>Impersonate any person or entity.</li>
                <li>Upload malicious code or content through any form on the Platform.</li>
                <li>Interfere with the proper operation of the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising from these Terms or your use of the Platform shall be subject to the
                exclusive jurisdiction of courts located in India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. The updated Terms will be posted on this
                page with a revised "Last updated" date. Your continued use of the Platform after any changes
                constitutes acceptance of the new Terms. We encourage you to review this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact</h2>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@waderaassociates.com" className="text-brand-blue hover:underline">
                  legal@waderaassociates.com
                </a>{' '}
                or through our{' '}
                <a href="/contact" className="text-brand-blue hover:underline">
                  contact page
                </a>.
              </p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
