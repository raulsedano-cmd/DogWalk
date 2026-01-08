import express from 'express';
import { acceptTerms, getLegalStatus } from '../controllers/legal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/accept', authenticate, acceptTerms);
router.get('/status', authenticate, getLegalStatus);

export default router;
