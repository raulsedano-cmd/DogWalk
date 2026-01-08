import express from 'express';
import { getMyDogs, createDog, updateDog, deleteDog, uploadDogPhoto } from '../controllers/dogs.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { dogPhotoUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', authenticate, requireRole('OWNER'), getMyDogs);
router.post('/', authenticate, requireRole('OWNER'), createDog);
router.put('/:id', authenticate, requireRole('OWNER'), updateDog);
router.delete('/:id', authenticate, requireRole('OWNER'), deleteDog);

// Photo Upload
router.post('/:id/photo', authenticate, requireRole('OWNER'), dogPhotoUpload.single('photo'), uploadDogPhoto);

export default router;
