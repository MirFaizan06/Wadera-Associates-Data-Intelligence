import { Router } from 'express';
import { protect, requireAdminRole } from '../../middleware/auth.middleware';
import {
  adminListPages, adminUpdatePage,
  adminListEmailTemplates, adminGetEmailTemplate, adminUpdateEmailTemplate, adminPreviewEmailTemplate,
  adminListContactMessages, adminUpdateContactStatus,
} from '../../controllers/cms.controller';
import {
  adminList as freeList,
  adminCreate as freeCreate,
  adminUpdate as freeUpdate,
  adminDelete as freeDelete,
} from '../../controllers/freeResource.controller';

const router = Router();
router.use(protect);
router.use(requireAdminRole('CMSManager'));

// Static pages
router.get('/pages', adminListPages);
router.put('/pages/:slug', adminUpdatePage);

// Email templates
router.get('/email-templates', adminListEmailTemplates);
router.get('/email-templates/:type', adminGetEmailTemplate);
router.put('/email-templates/:type', adminUpdateEmailTemplate);
router.post('/email-templates/preview', adminPreviewEmailTemplate);

// Contact messages
router.get('/contact-messages', adminListContactMessages);
router.patch('/contact-messages/:id', adminUpdateContactStatus);

// Free resources
router.get('/free-resources', freeList);
router.post('/free-resources', freeCreate);
router.put('/free-resources/:id', freeUpdate);
router.delete('/free-resources/:id', freeDelete);

export default router;
