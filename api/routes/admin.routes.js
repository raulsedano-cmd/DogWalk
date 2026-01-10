import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    getPendingVerifications, approveWalker, rejectWalker,
    getVerificationHistory, getAllWalkers, getSupportTickets, updateTicketStatus
} from '../controllers/admin.controller.js';

const router = express.Router();

// Protect these routes! ideally with an 'ADMIN' role check, but for now we just check auth
// In a real app, you MUST add requireRole('ADMIN') middleware
router.get('/verifications', authenticate, getPendingVerifications);
router.put('/verify/:userId', authenticate, approveWalker);
router.put('/reject/:userId', authenticate, rejectWalker);

// New Routes for Enhanced Dashboard
router.get('/history', authenticate, getVerificationHistory);
router.get('/walkers', authenticate, getAllWalkers);
router.get('/tickets', authenticate, getSupportTickets);
router.put('/tickets/:id', authenticate, updateTicketStatus);

export default router;
