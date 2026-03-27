import { Router } from 'express';
import multer from 'multer';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { loginLimiter, otpLimiter } from '../middleware/rateLimiter.middleware';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// Public
router.post('/register', loginLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, authController.resendOtp);
router.post('/logout', authController.logout);
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authController.resetPassword);

// Protected
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.post('/profile/picture', protect, avatarUpload.single('avatar'), authController.uploadProfilePicture);
router.put('/change-password', protect, authController.changePassword);

export default router;
