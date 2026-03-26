import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create roles
  const roles = [
    {
      name: 'Developer',
      permissions: [
        'view_all', 'edit_all', 'delete_all', 'manage_roles', 'manage_permissions',
        'view_logs', 'view_metrics', 'manage_users', 'manage_datasets',
        'manage_licenses', 'manage_payments', 'manage_cms', 'manage_settings',
        'view_financial', 'manage_ip_ban',
      ],
    },
    {
      name: 'FinancialManager',
      permissions: ['view_financial', 'view_orders', 'process_refunds', 'view_payment_logs'],
    },
    {
      name: 'DataManager',
      permissions: ['manage_datasets', 'upload_data', 'edit_datasets', 'view_datasets', 'manage_uom'],
    },
    {
      name: 'UserManager',
      permissions: ['manage_users', 'assign_licenses', 'revoke_licenses', 'view_download_logs', 'manage_ip_ban', 'send_emails'],
    },
    {
      name: 'CMSManager',
      permissions: ['manage_email_templates', 'manage_static_pages', 'manage_contact_messages', 'view_contact_messages'],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: { name: role.name, permissions: role.permissions },
    });
  }

  // Create default license types
  const licenseTypes = [
    {
      name: 'View Only',
      description: 'Can view dataset data but cannot download',
      permissions: ['VIEW'],
      maxDevices: 3,
      validDays: 365,
    },
    {
      name: 'Download Enabled',
      description: 'Can view and download dataset files',
      permissions: ['VIEW', 'DOWNLOAD'],
      maxDevices: 3,
      validDays: 365,
    },
    {
      name: 'Full Access',
      description: 'Full access including API and all download formats',
      permissions: ['VIEW', 'DOWNLOAD', 'API_ACCESS'],
      maxDevices: null,
      validDays: null,
    },
    {
      name: 'Guest Temporary',
      description: 'Temporary license for guest purchases (30 days)',
      permissions: ['VIEW', 'DOWNLOAD'],
      maxDevices: 2,
      validDays: 30,
    },
  ];

  for (const lt of licenseTypes) {
    await prisma.licenseType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }

  // Create developer admin user
  const devRole = await prisma.role.findUnique({ where: { name: 'Developer' } });
  if (devRole) {
    const adminEmail = process.env.DEVELOPER_ADMIN_EMAIL || 'admin@waderaassociates.com';
    const adminPassword = process.env.DEVELOPER_ADMIN_PASSWORD || 'ChangeMe@123';
    const hash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: hash,
        fullName: 'Developer Admin',
        roleId: devRole.id,
        isEmailVerified: true,
      },
    });
  }

  // Seed unit conversions
  const unitConversions = [
    { fromUnit: 'barrel', toUnit: 'liter', factor: 158.987, label: 'bbl → L' },
    { fromUnit: 'barrel', toUnit: 'gallon', factor: 42, label: 'bbl → gal' },
    { fromUnit: 'kWh', toUnit: 'MWh', factor: 0.001, label: 'kWh → MWh' },
    { fromUnit: 'MWh', toUnit: 'kWh', factor: 1000, label: 'MWh → kWh' },
    { fromUnit: 'ton', toUnit: 'kg', factor: 1000, label: 'ton → kg' },
    { fromUnit: 'MMBtu', toUnit: 'GJ', factor: 1.05506, label: 'MMBtu → GJ' },
  ];

  for (const uc of unitConversions) {
    await prisma.unitConversion.upsert({
      where: { fromUnit_toUnit: { fromUnit: uc.fromUnit, toUnit: uc.toUnit } },
      update: { factor: uc.factor },
      create: uc,
    });
  }

  // Seed email templates
  const emailTemplates = [
    {
      type: 'OTP',
      subject: 'Your Verification Code - Wadera Associates',
      htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a365d">Verify Your Email</h2>
<p>Your verification code is:</p>
<div style="background:#f0f4f8;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2b6cb0">{{otp}}</div>
<p>This code expires in <strong>10 minutes</strong>.</p>
<p style="color:#718096;font-size:14px">If you didn't request this, please ignore this email.</p>
</body></html>`,
    },
    {
      type: 'WELCOME',
      subject: 'Welcome to Wadera Associates Data Intelligence',
      htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a365d">Welcome, {{name}}!</h2>
<p>Thank you for joining Wadera Associates Data Intelligence Platform.</p>
<p>You now have access to our comprehensive time-series datasets. Start exploring our data catalog today.</p>
<a href="{{frontendUrl}}/datasets" style="background:#2b6cb0;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:16px">Browse Datasets</a>
<p style="color:#718096;font-size:14px;margin-top:32px">© {{year}} Wadera Associates. All rights reserved.</p>
</body></html>`,
    },
    {
      type: 'ORDER_CONFIRMATION',
      subject: 'Order Confirmed - {{datasetName}} | Wadera Associates',
      htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a365d">Order Confirmed!</h2>
<p>Hi {{name}},</p>
<p>Your purchase has been confirmed:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096">Dataset</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold">{{datasetName}}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096">Amount</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold">₹{{amount}}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096">Order ID</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">{{orderId}}</td></tr>
</table>
<a href="{{downloadUrl}}" style="background:#38a169;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Download Now</a>
<p style="color:#718096;font-size:14px;margin-top:32px">Download link expires in 24 hours.</p>
</body></html>`,
    },
    {
      type: 'PASSWORD_RESET',
      subject: 'Reset Your Password - Wadera Associates',
      htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a365d">Reset Your Password</h2>
<p>Click below to reset your password. This link expires in 1 hour.</p>
<a href="{{resetUrl}}" style="background:#e53e3e;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Reset Password</a>
<p style="color:#718096;font-size:14px">If you didn't request this, please ignore this email.</p>
</body></html>`,
    },
    {
      type: 'CONTACT_AUTO_REPLY',
      subject: 'We received your message - Wadera Associates',
      htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a365d">Thank you for contacting us!</h2>
<p>Hi {{name}},</p>
<p>We've received your message and will get back to you within 1-2 business days.</p>
<p>Your message: <em>{{message}}</em></p>
<p style="color:#718096;font-size:14px;margin-top:32px">© {{year}} Wadera Associates. All rights reserved.</p>
</body></html>`,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: {},
      create: template,
    });
  }

  // Seed static pages
  const staticPages = [
    {
      slug: 'about',
      title: 'About Us',
      metaTitle: 'About Wadera Associates - Data Intelligence Platform',
      metaDesc: 'Learn about Wadera Associates, your trusted source for premium time-series datasets covering energy, commodities, and financial markets.',
      content: `<h1>About Wadera Associates</h1>
<p>Wadera Associates is a data intelligence platform built for professionals who need reliable, structured time-series data to power their research, models, and business decisions.</p>
<p>We specialise in curating and delivering high-quality datasets across energy markets, commodity pricing, electricity tariffs, and macroeconomic indicators — primarily focused on South Asia, Southeast Asia, and global benchmarks.</p>

<h2>What We Offer</h2>
<ul>
  <li><strong>Premium Datasets</strong> — Clean, structured time-series data ready to use in XLSX, CSV, PDF, and PNG formats.</li>
  <li><strong>Free Resources</strong> — Publicly available articles, reports and sample data for the broader research community.</li>
  <li><strong>Multi-Currency Pricing</strong> — Transparent pricing displayed in your local currency with live exchange rates.</li>
  <li><strong>Instant Downloads</strong> — Purchase once, download immediately. No subscriptions or hidden fees.</li>
</ul>

<h2>Our Data</h2>
<p>Every dataset on our platform is manually verified and structured to a consistent standard. We source data from public government sources, energy regulatory authorities, international bodies, and proprietary research. Data is updated regularly and each dataset clearly indicates its source and coverage period.</p>

<h2>Who We Serve</h2>
<p>Our customers include energy analysts, policy researchers, investment firms, consultancies, academic institutions, and independent professionals who require trustworthy data for their work.</p>

<h2>Contact Us</h2>
<p>Have a question, a data request, or want to discuss a bulk licensing arrangement? Reach us through our <a href="/contact">contact page</a> and we will get back to you within 1–2 business days.</p>`,
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      metaTitle: 'Privacy Policy - Wadera Associates',
      metaDesc: 'Read our privacy policy to understand how Wadera Associates collects, uses, and protects your personal data.',
      content: `<h1>Privacy Policy</h1>
<p><em>Last updated: March 2025</em></p>
<p>This Privacy Policy explains how Wadera Associates ("we", "us", "our") collects, uses, and protects information about you when you use our platform at <strong>waderaassociates.com</strong>.</p>

<h2>1. Information We Collect</h2>
<h3>Account Information</h3>
<p>When you register, we collect your email address, full name, and optionally your phone number and profile picture.</p>
<h3>Purchase Information</h3>
<p>When you make a purchase, we collect billing details and payment confirmation data. We do not store raw card numbers — payments are processed securely through Razorpay.</p>
<h3>Usage Data</h3>
<p>We automatically collect information about your interactions with the platform including pages visited, datasets downloaded, IP address, browser type, and device information. This data is used to improve our service and for security monitoring.</p>
<h3>Communications</h3>
<p>If you contact us, we retain the content of that communication to assist you and improve our service.</p>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To provide, operate, and maintain the platform and your account.</li>
  <li>To process purchases and send order confirmations and download links.</li>
  <li>To send transactional emails (OTP codes, password resets, purchase receipts).</li>
  <li>To respond to your enquiries and support requests.</li>
  <li>To detect and prevent fraud, abuse, and security threats.</li>
  <li>To comply with applicable legal obligations.</li>
</ul>
<p>We do not sell, rent, or share your personal information with third parties for their own marketing purposes.</p>

<h2>3. Data Retention</h2>
<p>We retain your account information for as long as your account is active. Purchase records are retained for a minimum of 5 years for accounting and legal purposes. You may request deletion of your account by contacting us; however, purchase records required for legal compliance will be retained.</p>

<h2>4. Cookies</h2>
<p>We use HTTP-only session cookies for authentication. These cookies are strictly necessary for the platform to function and do not track you across other websites. We do not use advertising or analytics cookies.</p>

<h2>5. Data Security</h2>
<p>We implement industry-standard security measures including encrypted data transmission (TLS), hashed password storage (bcrypt), rate limiting, and IP monitoring. Despite these measures, no internet transmission is completely secure and we cannot guarantee absolute security.</p>

<h2>6. Third-Party Services</h2>
<p>We use the following third-party services which have their own privacy policies:</p>
<ul>
  <li><strong>Razorpay</strong> — Payment processing</li>
  <li><strong>Amazon Web Services (S3)</strong> — File storage</li>
  <li><strong>SMTP Provider</strong> — Transactional email delivery</li>
</ul>

<h2>7. Your Rights</h2>
<p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us through our <a href="/contact">contact page</a>. We will respond within 30 days.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this policy from time to time. We will notify registered users of significant changes by email. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>

<h2>9. Contact</h2>
<p>For privacy-related enquiries, please use our <a href="/contact">contact page</a>.</p>`,
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      metaTitle: 'Terms of Service - Wadera Associates',
      metaDesc: 'Read the terms and conditions for using the Wadera Associates data intelligence platform.',
      content: `<h1>Terms of Service</h1>
<p><em>Last updated: March 2025</em></p>
<p>These Terms of Service ("Terms") govern your use of the Wadera Associates platform at <strong>waderaassociates.com</strong>. By accessing or using the platform, you agree to be bound by these Terms.</p>

<h2>1. Platform Use</h2>
<p>The Wadera Associates platform provides access to time-series datasets and related data intelligence resources. You may use the platform only for lawful purposes and in accordance with these Terms. You agree not to:</p>
<ul>
  <li>Attempt to gain unauthorised access to any part of the platform or its infrastructure.</li>
  <li>Use automated tools to scrape, crawl, or bulk-download data beyond what your licence permits.</li>
  <li>Reverse engineer, redistribute, or resell datasets you have purchased.</li>
  <li>Misrepresent your identity or provide false information during registration or purchase.</li>
  <li>Use the platform in any way that could damage, disable, or impair its operation.</li>
</ul>

<h2>2. Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately if you suspect unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.</p>

<h2>3. Purchases and Licences</h2>
<p>All dataset purchases grant you a <strong>non-exclusive, non-transferable licence</strong> to use the purchased dataset for your own internal research or professional purposes. You may not:</p>
<ul>
  <li>Redistribute, republish, or resell dataset files in whole or in part.</li>
  <li>Use datasets to build competing data products or services without a written commercial licence.</li>
  <li>Share download links with third parties.</li>
</ul>
<p>Download links are time-limited (24 hours from purchase). If your link expires, contact us and we will assist you.</p>

<h2>4. Pricing and Payments</h2>
<p>All prices are displayed in Indian Rupees (INR) by default, with estimated equivalents shown in other currencies using live exchange rates. Actual charges are made in INR. Prices are inclusive of applicable taxes unless stated otherwise. Payments are processed by Razorpay and are subject to their terms.</p>

<h2>5. Refunds</h2>
<p>Due to the digital nature of our products, we do not offer refunds once a dataset has been downloaded. If you experience a technical issue preventing you from accessing a purchased dataset, contact us within 48 hours of purchase and we will investigate and resolve the issue or provide a replacement download.</p>

<h2>6. Free Resources</h2>
<p>Free articles, reports, and sample datasets are provided for informational purposes only. They are provided "as is" without warranty of accuracy or completeness. Free resources may not be redistributed commercially without written permission.</p>

<h2>7. Intellectual Property</h2>
<p>All content on the platform — including dataset documentation, platform design, and written articles — is the intellectual property of Wadera Associates unless otherwise stated. Source data may be sourced from third-party public bodies and will be attributed accordingly in dataset metadata.</p>

<h2>8. Disclaimers</h2>
<p>Data on this platform is provided for informational purposes. Wadera Associates makes reasonable efforts to ensure accuracy but does not guarantee that data is complete, error-free, or current. Data should not be relied upon as the sole basis for financial, investment, or policy decisions. We accept no liability for decisions made based on platform data.</p>

<h2>9. Limitation of Liability</h2>
<p>To the maximum extent permitted by law, Wadera Associates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform or data. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>

<h2>10. Governing Law</h2>
<p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>

<h2>11. Changes to Terms</h2>
<p>We reserve the right to update these Terms. We will notify registered users of material changes by email. Continued use of the platform after changes constitutes acceptance of the updated Terms.</p>

<h2>12. Contact</h2>
<p>For questions about these Terms, contact us through our <a href="/contact">contact page</a>.</p>`,
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      metaTitle: 'Contact Wadera Associates',
      metaDesc: 'Contact the Wadera Associates team for dataset enquiries, technical support, or partnership opportunities.',
      content: `<h1>Contact Us</h1>
<p>We would love to hear from you. Whether you have a question about our datasets, need technical support, or want to discuss a custom data requirement, reach out using the form on this page.</p>
<p>We typically respond within <strong>1–2 business days</strong>.</p>
<h2>Common Enquiries</h2>
<ul>
  <li><strong>Dataset availability</strong> — Looking for a specific dataset not listed? Tell us and we will look into sourcing it.</li>
  <li><strong>Bulk or commercial licences</strong> — Need datasets for a large team or for integration into a product? We can discuss custom licensing.</li>
  <li><strong>Technical issues</strong> — Download not working? Account issue? We will resolve it promptly.</li>
  <li><strong>Corrections</strong> — Found an error in a dataset? Please let us know so we can correct it.</li>
</ul>`,
    },
  ];

  for (const page of staticPages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content, metaTitle: page.metaTitle, metaDesc: page.metaDesc },
      create: page,
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
