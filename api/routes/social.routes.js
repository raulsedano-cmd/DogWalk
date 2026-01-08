import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    getFavorites,
    addFavorite,
    removeFavorite,
    getBlockedWalkers,
    blockWalker,
    unblockWalker
} from '../controllers/social.controller.js';

const router = express.Router();

router.use(authenticate);

// Favorites
router.get('/favorites', getFavorites);
router.post('/favorites/:walkerId', addFavorite);
router.delete('/favorites/:walkerId', removeFavorite);

// Blocking
router.get('/blocked', getBlockedWalkers);
router.post('/blocked/:walkerId', blockWalker);
router.delete('/blocked/:walkerId', unblockWalker);

export default router;
