import express from 'express';
import { getWalkerPayments } from '../controllers/walk-assignments.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/payments', authenticate, requireRole('WALKER'), getWalkerPayments);

export default router;
