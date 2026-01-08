import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);

export default router;
