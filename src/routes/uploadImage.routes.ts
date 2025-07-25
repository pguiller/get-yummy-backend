import express from 'express';
import { uploadImage } from '../controllers/uploadImage.controller';

const router = express.Router();

router.post('/', uploadImage);

export default router;
