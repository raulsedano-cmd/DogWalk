import express from 'express';
import { getMyProfile, updateMyProfile, getUserById } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, upload.single('profilePic'), updateMyProfile);
router.get('/:id', authenticate, getUserById);

export default router;
