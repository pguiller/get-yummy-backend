import express from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkIfFavorite
} from '../controllers/favorite.controller';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Ajouter une recette aux favoris
router.post('/', addToFavorites);

// Récupérer tous les favoris de l'utilisateur connecté
router.get('/', getUserFavorites);

// Vérifier si une recette est dans les favoris
router.get('/check/:recipeId', checkIfFavorite);

// Supprimer une recette des favoris
router.delete('/:recipeId', removeFromFavorites);

export default router; 