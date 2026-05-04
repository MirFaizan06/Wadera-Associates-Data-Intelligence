import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { ipBanCheck } from './middleware/ipBan.middleware';
import { logger } from './utils/logger';
import { env } from './config/env';

// Route imports
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import userRoutes from './routes/user.routes';
import adminDevRoutes from './routes/admin/dev.routes';
import adminFinanceRoutes from './routes/admin/finance.routes';
import adminDataRoutes from './routes/admin/data.routes';
import adminUsersRoutes from './routes/admin/users.routes';
import adminCmsRoutes from './routes/admin/cms.routes';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://flagcdn.com', 'https://fonts.gstatic.com',
        // Cloudflare R2 public URL (empty string is safely ignored by browsers)
        ...(env.R2_PUBLIC_URL ? [new URL(env.R2_PUBLIC_URL).origin] : []),
      ],
      connectSrc: ["'self'", env.FRONTEND_URL],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// IP ban check (before rate limiting)
app.use(ipBanCheck);

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin/dev', adminDevRoutes);
app.use('/api/v1/admin/finance', adminFinanceRoutes);
app.use('/api/v1/admin/data', adminDataRoutes);
app.use('/api/v1/admin/users', adminUsersRoutes);
app.use('/api/v1/admin/cms', adminCmsRoutes);

// Static files (local dev avatar uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
