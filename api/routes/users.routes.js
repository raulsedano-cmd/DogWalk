import express from 'express';
import { getMyProfile, updateMyProfile, getUserById, activateRole, switchRole } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, upload.single('profilePic'), updateMyProfile);
router.post('/activate-role', authenticate, activateRole);
router.post('/switch-role', authenticate, switchRole);
router.get('/:id', authenticate, getUserById);

export default router;
