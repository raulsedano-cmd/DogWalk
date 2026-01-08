import express from 'express';
import {
    getOffersForWalkRequest,
    createOffer,
    acceptOffer,
    rejectOffer,
} from '../controllers/offers.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/walk-request/:walkRequestId', authenticate, requireRole('OWNER'), getOffersForWalkRequest);
router.post('/', authenticate, requireRole('WALKER'), createOffer);
router.put('/:id/accept', authenticate, requireRole('OWNER'), acceptOffer);
router.put('/:id/reject', authenticate, requireRole('OWNER'), rejectOffer);

export default router;
