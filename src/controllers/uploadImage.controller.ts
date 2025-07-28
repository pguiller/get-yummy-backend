import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';

export const uploadImage = async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ message: 'Paramètre imageBase64 requis.' });

  // Validate base64 format
  if (typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
    return res.status(400).json({ 
      message: 'Format d\'image invalide. Le format attendu est: data:image/[type];base64,[data]'
    });
  }

  try {
    // Extract image type
    const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: 'Format d\'image invalide.' });
    }
    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Generate date-time prefix
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const datePrefix = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    // Generate unique filename
    const filename = `${datePrefix}-${uuidv4()}.${ext}`;
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, buffer);

    // Save file path to DB
    const imageRecord = await prisma.image.create({
      data: {
        filename,
        path: `/uploads/${filename}`,
      },
    });

    res.json({ message: 'Image uploadée avec succès.', image: imageRecord });
  } catch (err: any) {
    console.error('Erreur lors de l\'upload de l\'image:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image.', details: err.message });
  }
};

export const listImages = async (req: Request, res: Response) => {
  try {
    const images = await prisma.image.findMany({ orderBy: { uploadedAt: 'desc' } });
    res.json(images);
  } catch (err: any) {
    console.error('Erreur lors de la récupération des images:', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des images.', details: err.message });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Paramètre id requis.' });

  try {
    // Find the image record
    const image = await prisma.image.findUnique({ where: { id: Number(id) } });
    if (!image) {
      return res.status(404).json({ message: 'Image non trouvée.' });
    }

    // Delete the file from disk
    const filePath = path.join(__dirname, '../../uploads', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the record from DB
    await prisma.image.delete({ where: { id: Number(id) } });

    res.json({ message: 'Image supprimée avec succès.' });
  } catch (err: any) {
    console.error('Erreur lors de la suppression de l\'image:', err.message);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'image.', details: err.message });
  }
};
