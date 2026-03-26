import { Helmet } from 'react-helmet-async';

const LAST_UPDATED = 'March 2026';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Wadera Associates</title>
        <meta name="description" content="Privacy Policy for Wadera Associates Data Intelligence platform." />
        <link rel="canonical" href="https://wa-data-intel.netlify.app/pages/privacy-policy" />
        <meta property="og:title" content="Privacy Policy — Wadera Associates" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wa-data-intel.netlify.app/pages/privacy-policy" />
        <meta property="og:site_name" content="Wadera Associates" />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-16">
        <div className="container max-w-3xl">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest text-brand-blue uppercase mb-2">Legal</p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 space-y-8 text-gray-700 text-[15px] leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                Wadera Associates ("we", "our", or "us") operates the Wadera Associates Data Intelligence platform
                accessible at <strong>waderaassociates.com</strong> (the "Platform"). This Privacy Policy explains how we
                collect, use, disclose, and safeguard your personal information when you visit or make a purchase on our Platform.
              </p>
              <p className="mt-3">
                By accessing or using the Platform, you agree to the terms of this Privacy Policy. If you do not agree,
                please discontinue use of the Platform immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <h3 className="font-semibold text-gray-800 mb-2">2.1 Information You Provide Directly</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>Account Registration:</strong> Name, email address, and password when you create an account.</li>
                <li><strong>Profile Information:</strong> Phone number and profile picture (optional).</li>
                <li><strong>Purchase Information:</strong> Email address and billing details collected during checkout for payment processing.</li>
                <li><strong>Contact Forms:</strong> Name, email, and the message content you submit via our contact page.</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-5 mb-2">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>Log Data:</strong> IP address, browser type, operating system, referring URLs, and pages visited.</li>
                <li><strong>Device Information:</strong> Device identifiers and session information.</li>
                <li><strong>Usage Data:</strong> Dataset views, downloads, and purchase activity associated with your account.</li>
                <li><strong>Geolocation:</strong> Approximate country-level location derived from your IP address to display relevant pricing.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use collected information to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Create and manage your account and authenticate your identity.</li>
                <li>Process payments and deliver purchased datasets via secure download links.</li>
                <li>Send transactional emails such as purchase confirmations, OTP codes, and password reset links.</li>
                <li>Respond to your enquiries and support requests.</li>
                <li>Display pricing in your preferred or detected currency.</li>
                <li>Detect and prevent fraudulent transactions and unauthorised access.</li>
                <li>Comply with applicable legal and regulatory obligations.</li>
                <li>Improve our Platform's functionality and content over time.</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell your personal data to third parties. We do not use your data for
                targeted advertising or share it with data brokers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Payment Processing</h2>
              <p>
                All payment transactions are processed by <strong>Razorpay</strong>, a PCI-DSS compliant payment
                gateway. We do not collect, store, or have access to your full card number, CVV, or other sensitive
                payment credentials. Razorpay's own privacy policy governs the processing of payment data.
              </p>
              <p className="mt-3">
                We store only the Razorpay Order ID, Payment ID, and payment status for our records and
                for purchase verification purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage and Security</h2>
              <p>
                Your data is stored on secured servers. File uploads (such as profile pictures) may be stored
                on Amazon Web Services (AWS) S3. We employ industry-standard security measures including
                HTTPS/TLS encryption in transit, hashed passwords, and access controls.
              </p>
              <p className="mt-3">
                No method of electronic storage or transmission is 100% secure. While we take reasonable
                precautions, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Account data is retained while your account is active and for a reasonable period after deletion.</li>
                <li>Purchase records are retained for a minimum of 7 years to comply with financial and tax regulations.</li>
                <li>Contact form messages are retained for 12 months then deleted.</li>
                <li>Log data is retained for up to 90 days for security and debugging purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Third-Party Services</h2>
              <p>We use the following third-party services that may process your data:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mt-3">
                <li><strong>Razorpay</strong> — Payment processing</li>
                <li><strong>Amazon Web Services (AWS)</strong> — File storage</li>
                <li><strong>SMTP Email Provider</strong> — Transactional email delivery</li>
                <li><strong>IP Geolocation API</strong> — Approximate location for currency detection (no personal data shared)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
              <p>
                We use minimal, strictly necessary cookies for session management and authentication (JWT tokens
                stored in httpOnly cookies or localStorage). We do not use advertising cookies, tracking pixels,
                or analytics cookies at this time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Your Rights</h2>
              <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data (subject to legal retention requirements).</li>
                <li>Withdraw consent for non-essential data processing.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@waderaassociates.com" className="text-brand-blue hover:underline">
                  privacy@waderaassociates.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p>
                Our Platform is not directed at children under 18. We do not knowingly collect personal
                information from minors. If you believe we have inadvertently done so, contact us and we
                will delete the data promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The "Last updated" date at the top of this
                page reflects the most recent revision. Continued use of the Platform after changes constitutes
                acceptance of the updated policy. We recommend reviewing this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact Us</h2>
              <p>
                For privacy-related questions or requests, contact us at{' '}
                <a href="mailto:privacy@waderaassociates.com" className="text-brand-blue hover:underline">
                  privacy@waderaassociates.com
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
