import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ajouter une recette aux favoris
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: 'ID de recette requis' });
    }

    // Vérifier si la recette existe
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(recipeId) }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }

    // Vérifier si le favori existe déjà
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        recipeId: parseInt(recipeId)
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Cette recette est déjà dans vos favoris' });
    }

    // Ajouter aux favoris
    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        recipeId: parseInt(recipeId)
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
            steps: true,
            tags: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Recette ajoutée aux favoris',
      favorite: {
        id: favorite.id,
        createdAt: favorite.createdAt,
        recipe: favorite.recipe
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Supprimer une recette des favoris
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const { recipeId } = req.params;

    // Vérifier si le favori existe
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        recipeId: parseInt(recipeId)
      }
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    // Supprimer le favori
    await prisma.favorite.delete({
      where: {
        id: favorite.id
      }
    });

    res.json({ message: 'Recette supprimée des favoris' });
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Récupérer tous les favoris d'un utilisateur
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: userId
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
            steps: true,
            tags: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      favorites: favorites.map(fav => ({
        id: fav.id,
        createdAt: fav.createdAt,
        recipe: fav.recipe
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Vérifier si une recette est dans les favoris
export const checkIfFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const { recipeId } = req.params;

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        recipeId: parseInt(recipeId)
      }
    });

    res.json({
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du favori:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}; 