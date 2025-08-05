import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOptions } from './config/corsOptions';
import userRoutes from './routes/user.routes';
import recipeRoutes from './routes/recipe.routes';
import uploadImageRoutes from './routes/uploadImage.routes';
import authRoutes from './routes/auth.routes';
import favoriteRoutes from './routes/favorite.routes';
import path from 'path';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/upload', uploadImageRoutes);
app.use('/auth', authRoutes);
app.use('/favorites', favoriteRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Serve the uploads directory as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

export default app;
