import express from 'express';
import { createTicket, getMyTickets } from '../controllers/support.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/tickets', authenticate, createTicket);
router.get('/tickets', authenticate, getMyTickets);

export default router;
