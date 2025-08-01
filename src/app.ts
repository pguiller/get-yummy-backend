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

// Serve the uploads directory as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export default app;
