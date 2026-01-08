import express from 'express';
import {
    getWalkRequests,
    getWalkRequestById,
    createWalkRequest,
    updateWalkRequest,
    cancelWalkRequest,
    deleteWalkRequest,
} from '../controllers/walk-requests.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getWalkRequests);
router.get('/:id', authenticate, getWalkRequestById);
router.post('/', authenticate, requireRole('OWNER'), createWalkRequest);
router.put('/:id', authenticate, requireRole('OWNER'), updateWalkRequest);
router.delete('/:id', authenticate, requireRole('OWNER'), deleteWalkRequest);

export default router;
