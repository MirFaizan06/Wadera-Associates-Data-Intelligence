import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { prisma } from './prisma';
import { logger } from './logger';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'localhost',
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  } : undefined,
});

interface EmailOptions {
  to: string;
  type: string;
  variables: Record<string, string | number>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, type, variables } = options;

  // Fetch template from DB
  const template = await prisma.emailTemplate.findUnique({ where: { type, isActive: true } });
  if (!template) {
    logger.warn('Email template not found', { type });
    return;
  }

  // Compile Handlebars template
  const subjectTemplate = Handlebars.compile(template.subject);
  const bodyTemplate = Handlebars.compile(template.htmlBody);

  const allVars = {
    ...variables,
    year: new Date().getFullYear(),
    frontendUrl: env.FRONTEND_URL,
  };

  const subject = subjectTemplate(allVars);
  const html = bodyTemplate(allVars);

  let status = 'SENT';
  let error: string | undefined;

  try {
    await transporter.sendMail({
      from: `Wadera Associates <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    status = 'FAILED';
    error = err instanceof Error ? err.message : String(err);
    logger.error('Failed to send email', { to, type, error });
  }

  // Log the email
  await prisma.emailLog.create({
    data: { type, recipient: to, subject, status, error },
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  await sendEmail({ to: email, type: 'OTP', variables: { otp } });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({ to: email, type: 'WELCOME', variables: { name } });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  datasetName: string,
  amount: number,
  orderId: string,
  downloadUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    type: 'ORDER_CONFIRMATION',
    variables: { name, datasetName, amount, orderId, downloadUrl },
  });
}

export async function sendContactAutoReply(email: string, name: string, message: string): Promise<void> {
  await sendEmail({ to: email, type: 'CONTACT_AUTO_REPLY', variables: { name, message } });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendEmail({ to: email, type: 'PASSWORD_RESET', variables: { resetUrl } });
}
