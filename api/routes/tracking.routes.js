import express from 'express';
import { updateLocation, getRoute } from '../controllers/tracking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/walk-assignments/:id/location', authenticate, updateLocation);
router.get('/walk-assignments/:id/route', authenticate, getRoute);

export default router;
