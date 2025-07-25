import { Request, Response } from 'express';
import axios from 'axios';

export const uploadImage = async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ message: 'Paramètre imageBase64 requis.' });

  try {
    const apiKey = process.env.FREEIMAGE_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Clé API non configurée.' });

    const payload = {
      key: apiKey,
      action: 'upload',
      source: imageBase64,
      format: 'json',
    };

    const response = await axios.post('https://freeimage.host/api/1/upload/', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const imageUrl = response.data.image?.url;
    if (!imageUrl) return res.status(500).json({ message: 'Erreur réponse freeimage.host', raw: response.data });

    res.json({ message: 'Image uploadée avec succès.', imageUrl });
  } catch (err: any) {
    console.error('Erreur upload freeimage.host:', err.response?.data || err.message);
    res.status(500).json({ message: 'Erreur lors de l’upload de l’image.' });
  }
};
