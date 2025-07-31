import express from 'express';
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipesByOwnerId,
  getIngredientOptions,
  getRecipeByName,
} from '../controllers/recipe.controller';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

router.get('/', getAllRecipes);
router.get('/ingredients', getIngredientOptions);
router.get('/owner/:ownerId', authenticateToken, getRecipesByOwnerId);
router.get('/name/:name', getRecipeByName);
router.get('/:id', getRecipeById);
router.post('/', authenticateToken, createRecipe);
router.put('/:id', authenticateToken, updateRecipe);
router.delete('/:id', authenticateToken, deleteRecipe);

export default router;
