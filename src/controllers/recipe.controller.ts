import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticateToken";
import prisma from "../prisma/client";
import { getIngredientDisplayName } from "../utils/ingredientMapping";

// GET all recipes
export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        steps: true,
        tags: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Transform ingredients to include both name and displayName
    const recipesWithDisplayNames = recipes.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        displayName: getIngredientDisplayName(ingredient.name),
        unit: ingredient.unit,
        value: ingredient.value,
        recipeId: ingredient.recipeId,
      })),
    }));

    res.json(recipesWithDisplayNames);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des recettes" });
  }
};

// GET recipe by ID
export const getRecipeById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        steps: true,
        tags: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!recipe) return res.status(404).json({ message: "Recette non trouvée" });
    
    // Transform ingredients to include both name and displayName
    const recipeWithDisplayNames = {
      ...recipe,
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        displayName: getIngredientDisplayName(ingredient.name),
        unit: ingredient.unit,
        value: ingredient.value,
        recipeId: ingredient.recipeId,
      })),
    };
    
    res.json(recipeWithDisplayNames);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de la recette" });
  }
};

// GET all recipes of ownerID
export const getRecipesByOwnerId = async (req: Request, res: Response) => {
    const ownerId = Number(req.params.ownerId);
    if (isNaN(ownerId)) {
      return res.status(400).json({ message: "Utilisateur.ice inconnu.e." });
    }
  
    try {
      const recipes = await prisma.recipe.findMany({
        where: { ownerId },
        include: {
          ingredients: true,
          steps: true,
          tags: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Transform ingredients to include both name and displayName
      const recipesWithDisplayNames = recipes.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          displayName: getIngredientDisplayName(ingredient.name),
          unit: ingredient.unit,
          value: ingredient.value,
          recipeId: ingredient.recipeId,
        })),
      }));
  
      res.json(recipesWithDisplayNames);
    } catch (error) {
      console.error('Erreur de récupération des recettes par propriétaire:', error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };


// CREATE recipe (seulement si connecté)
export const createRecipe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non autorisé.e" });

  try {
    const {
      name,
      image,
      preparation_time,
      baking_time,
      thermostat,
      resting_time,
      number_of_persons,
      link,
      ingredients,
      steps,
      tags,
    } = req.body;

    // Generate current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    const newRecipe = await prisma.recipe.create({
      data: {
        name,
        date: currentDate, // Use current date automatically
        image,
        preparation_time,
        baking_time,
        thermostat,
        resting_time,
        number_of_persons,
        link,
        owner: { connect: { id: req.user.userId } }, // lier au user connecté
        ingredients: {
          create: ingredients.map((ingredient: any) => ({
            name: ingredient.name,
            unit: ingredient.unit,
            value: ingredient.value,
          })),
        },
        steps: {
          create: steps.map((step: any) => ({
            description: step.description,
            image: step.image,
          })),
        },
        tags: {
          create: tags.map((tag: any) => ({
            value: tag.value,
          })),
        },
      },
    });

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Erreur lors de la création de la recette:', error);
    res.status(500).json({ error: "Erreur lors de la création de la recette" });
  }
};

// UPDATE recipe (seulement si connecté et owner)
export const updateRecipe = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!req.user) return res.status(401).json({ message: "Non autorisé" });

  try {
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    if (existingRecipe.ownerId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres recettes" });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: req.body,
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour de la recette" });
  }
};

// GET all available ingredient options
export const getIngredientOptions = async (req: Request, res: Response) => {
  try {
    const { ingredientDisplayNames } = await import("../utils/ingredientMapping");
    const ingredients = Object.entries(ingredientDisplayNames).map(([name, displayName]) => ({
      name,
      displayName,
    }));
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des options d'ingrédients" });
  }
};

// DELETE recipe (seulement si connecté et owner ou admin)
export const deleteRecipe = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!req.user) return res.status(401).json({ message: "Non autorisé" });

  try {
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    if (existingRecipe.ownerId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres recettes" });
    }

    await prisma.recipe.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("Erreur deleteRecipe :", error);
    res.status(500).json({ error: "Erreur lors de la suppression de la recette" });
  }
};

// GET recipe by name
export const getRecipeByName = async (req: Request, res: Response) => {
  const name = req.params.name;
  try {
    // If you get a type error here, run 'npx prisma generate' to update types after schema change.
    const recipe = await prisma.recipe.findUnique({
      where: { name },
      include: {
        ingredients: true,
        steps: true,
        tags: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!recipe) return res.status(404).json({ message: "Recette non trouvée" });

    // Transform ingredients to include both name and displayName
    const recipeWithDisplayNames = {
      ...recipe,
      ingredients: recipe.ingredients.map((ingredient: any) => ({
        id: ingredient.id,
        name: ingredient.name,
        displayName: getIngredientDisplayName(ingredient.name),
        unit: ingredient.unit,
        value: ingredient.value,
        recipeId: ingredient.recipeId,
      })),
    };

    res.json(recipeWithDisplayNames);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de la recette par nom" });
  }
};

// GET all recipes for the authenticated user
export const getMyRecipes = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Utilisateur non authentifié." });
  }
  try {
    const recipes = await prisma.recipe.findMany({
      where: { ownerId: userId },
      include: {
        ingredients: true,
        steps: true,
        tags: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Transform ingredients to include both name and displayName
    const recipesWithDisplayNames = recipes.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        displayName: getIngredientDisplayName(ingredient.name),
        unit: ingredient.unit,
        value: ingredient.value,
        recipeId: ingredient.recipeId,
      })),
    }));
    res.json(recipesWithDisplayNames);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des recettes de l'utilisateur authentifié" });
  }
};
