import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { googleLogin, facebookLogin, microsoftLogin } from '../controllers/auth.social.controller.js';
import { authLimiter } from '../middleware/rate-limit.middleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Social Auth
router.post('/google', authLimiter, googleLogin);
router.post('/facebook', authLimiter, facebookLogin);
router.post('/microsoft', authLimiter, microsoftLogin);

export default router;
