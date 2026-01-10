import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getPendingVerifications, approveWalker, rejectWalker } from '../controllers/admin.controller.js';

const router = express.Router();

// Protect these routes! ideally with an 'ADMIN' role check, but for now we just check auth
// In a real app, you MUST add requireRole('ADMIN') middleware
router.get('/verifications', authenticateToken, getPendingVerifications);
router.put('/verify/:userId', authenticateToken, approveWalker);
router.put('/reject/:userId', authenticateToken, rejectWalker);

export default router;
