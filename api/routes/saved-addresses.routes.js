import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    getMySavedAddresses,
    createSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    setDefaultAddress
} from '../controllers/saved-addresses.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all saved addresses for the user
router.get('/', getMySavedAddresses);

// Create a new saved address
router.post('/', createSavedAddress);

// Update a saved address
router.put('/:id', updateSavedAddress);

// Delete a saved address
router.delete('/:id', deleteSavedAddress);

// Set address as default
router.patch('/:id/set-default', setDefaultAddress);

export default router;
