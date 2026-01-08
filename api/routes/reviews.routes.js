import express from 'express';
import { createReview, getWalkerReviews } from '../controllers/reviews.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('OWNER'), createReview);
router.get('/walker/:walkerId', authenticate, getWalkerReviews);

export default router;
