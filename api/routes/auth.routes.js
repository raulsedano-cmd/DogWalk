import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { googleLogin, facebookLogin, microsoftLogin } from '../controllers/auth.social.controller.js';
import { authLimiter } from '../middleware/rate-limit.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Social Auth
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/microsoft', microsoftLogin);

export default router;
