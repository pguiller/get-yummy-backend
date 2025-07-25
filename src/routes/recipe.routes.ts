import express from 'express';
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipesByOwnerId,
} from '../controllers/recipe.controller';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

router.get('/', getAllRecipes);
router.get('/owner/:ownerId', authenticateToken, getRecipesByOwnerId);
router.get('/:id', getRecipeById);
router.post('/', authenticateToken, createRecipe);
router.put('/:id', authenticateToken, updateRecipe);
router.delete('/:id', authenticateToken, deleteRecipe);

export default router;
