import { Router } from 'express';
import * as datasetController from '../controllers/dataset.controller';
import * as freeResourceController from '../controllers/freeResource.controller';
import { contactController } from '../controllers/contact.controller';
import { getExchangeRates } from '../controllers/exchangeRate.controller';
import { getStaticPage, getSitemap } from '../controllers/cms.controller';
import { contactLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Datasets
router.get('/datasets', datasetController.listPublic);
router.get('/datasets/featured', datasetController.getFeatured);
router.get('/datasets/categories', datasetController.getCategories);
router.get('/datasets/:slug', datasetController.getBySlug);

// Free resources
router.get('/free', freeResourceController.listPublic);
router.get('/free/categories', freeResourceController.getPublicCategories);
router.get('/free/:slug', freeResourceController.getBySlug);

// Exchange rates
router.get('/exchange-rates', getExchangeRates);

// CMS
router.get('/pages/:slug', getStaticPage);
router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${process.env.FRONTEND_URL}/sitemap.xml`);
});

// Contact
router.post('/contact', contactLimiter, contactController.submit);

export default router;
