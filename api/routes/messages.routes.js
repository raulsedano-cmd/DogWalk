import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getMessages, sendMessage } from '../controllers/messages.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/walk-request/:walkRequestId', getMessages);
router.post('/', sendMessage);

export default router;
