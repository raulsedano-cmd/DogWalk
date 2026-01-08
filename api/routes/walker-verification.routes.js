import express from 'express';
import { submitVerification, getVerificationStatus } from '../controllers/walker-verification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { verificationUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', authenticate, verificationUpload.fields([
    { name: 'dniFront', maxCount: 1 },
    { name: 'dniBack', maxCount: 1 }
]), submitVerification);

router.get('/status', authenticate, getVerificationStatus);

export default router;
