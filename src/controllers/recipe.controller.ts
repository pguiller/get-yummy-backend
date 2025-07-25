import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticateToken";
import prisma from "../prisma/client";

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
    res.json(recipes);
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
    res.json(recipe);
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
  
      res.json(recipes);
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
      date,
      image,
      preparation_time_value,
      preparation_time_unit,
      baking_time_value,
      baking_time_unit,
      thermostat,
      resting_time_value,
      resting_time_unit,
      number_of_persons,
      link,
      ingredients,
      steps,
      tags,
    } = req.body;

    const newRecipe = await prisma.recipe.create({
      data: {
        name,
        date,
        image,
        preparation_time_value,
        preparation_time_unit,
        baking_time_value,
        baking_time_unit,
        thermostat,
        resting_time_value,
        resting_time_unit,
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

    if (existingRecipe.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres recettes" });
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

// DELETE recipe (seulement si connecté et owner)
export const deleteRecipe = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!req.user) return res.status(401).json({ message: "Non autorisé" });

  try {
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    if (existingRecipe.ownerId !== req.user.userId) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres recettes" });
    }

    await prisma.recipe.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de la recette" });
  }
};
