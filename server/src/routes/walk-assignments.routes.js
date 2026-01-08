import express from 'express';
import {
    getMyAssignments,
    getAssignmentById,
    startAssignment,
    cancelAssignment,
    completeAssignment,
    uploadWalkPhotos,
    getWalkPhotos,
    markPaid
} from '../controllers/walk-assignments.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { walkPhotosUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', authenticate, getMyAssignments);
router.get('/:id', authenticate, getAssignmentById);

// Walk Lifecycle
router.put('/:id/start', authenticate, startAssignment);
router.put('/:id/cancel', authenticate, cancelAssignment);
router.put('/:id/complete', authenticate, completeAssignment);

// Photos
router.post('/:id/photos', authenticate, walkPhotosUpload.array('photos', 5), uploadWalkPhotos);
router.get('/:id/photos', authenticate, getWalkPhotos);

// Payments (Owner confirms external payment)
router.put('/:id/mark-paid', authenticate, markPaid);

export default router;
