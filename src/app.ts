import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOptions } from './config/corsOptions';
import userRoutes from './routes/user.routes';
import recipeRoutes from './routes/recipe.routes';
import uploadImageRoutes from './routes/uploadImage.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/upload', uploadImageRoutes);
app.use('/auth', authRoutes);

export default app;
