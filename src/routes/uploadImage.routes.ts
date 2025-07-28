import { Router } from 'express';
import { uploadImage, listImages, deleteImage } from '../controllers/uploadImage.controller';

const router = Router();

router.post('/upload', uploadImage);
router.get('/all', listImages);
router.delete('/:id', deleteImage);

export default router;
