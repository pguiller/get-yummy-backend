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
          select: { id: true, name: true },
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
          select: { id: true, name: true },
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
            select: { id: true, name: true },
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

    // Vérifier si une recette avec ce nom existe déjà
    const existingRecipe = await prisma.recipe.findUnique({
      where: { name }
    });

    if (existingRecipe) {
      return res.status(409).json({ 
        error: "Une recette avec ce nom existe déjà",
      });
    }

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
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        steps: true,
        tags: true,
      },
    });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    if (existingRecipe.ownerId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres recettes" });
    }

    // Extraction des champs du body
    const {
      name,
      image,
      preparation_time,
      baking_time,
      thermostat,
      resting_time,
      number_of_persons,
      link,
      ingredients = [],
      steps = [],
      tags = [],
    } = req.body;

    // Vérifier si le nouveau nom existe déjà sur une autre recette
    if (name && name !== existingRecipe.name) {
      const existingRecipeWithSameName = await prisma.recipe.findUnique({
        where: { name }
      });
      
      if (existingRecipeWithSameName && existingRecipeWithSameName.id !== id) {
        return res.status(409).json({ 
          error: "Une recette avec ce nom existe déjà",
        });
      }
    }

    // --- INGREDIENTS ---
    type IngredientInput = { id?: number; name: string; unit?: string; value: number };
    const currentIngredientIds = existingRecipe.ingredients.map((i: any) => i.id);
    const incomingIngredientIds = (ingredients as IngredientInput[]).filter((i) => i.id).map((i) => i.id!);
    // À supprimer
    const ingredientsToDelete = currentIngredientIds.filter((id: number) => !incomingIngredientIds.includes(id));
    // À mettre à jour
    const ingredientsToUpdate = (ingredients as IngredientInput[]).filter((i) => i.id);
    // À créer
    const ingredientsToCreate = (ingredients as IngredientInput[]).filter((i) => !i.id);

    // --- STEPS ---
    type StepInput = { id?: number; description: string; image?: string };
    const currentStepIds = existingRecipe.steps.map((s: any) => s.id);
    const incomingStepIds = (steps as StepInput[]).filter((s) => s.id).map((s) => s.id!);
    const stepsToDelete = currentStepIds.filter((id: number) => !incomingStepIds.includes(id));
    const stepsToUpdate = (steps as StepInput[]).filter((s) => s.id);
    const stepsToCreate = (steps as StepInput[]).filter((s) => !s.id);

    // --- TAGS ---
    type TagInput = { id?: number; value: string };
    const currentTagIds = existingRecipe.tags.map((t: any) => t.id);
    const incomingTagIds = (tags as TagInput[]).filter((t) => t.id).map((t) => t.id!);
    const tagsToDelete = currentTagIds.filter((id: number) => !incomingTagIds.includes(id));
    const tagsToUpdate = (tags as TagInput[]).filter((t) => t.id);
    const tagsToCreate = (tags as TagInput[]).filter((t) => !t.id);

    const data: any = {
      name,
      image,
      preparation_time,
      baking_time,
      thermostat,
      resting_time,
      number_of_persons,
      link,
      // --- INGREDIENTS ---
      ingredients: {
        deleteMany: ingredientsToDelete.map(id => ({ id })),
        update: ingredientsToUpdate.map(i => ({
          where: { id: i.id },
          data: {
            name: i.name,
            unit: i.unit,
            value: i.value,
          },
        })),
        create: ingredientsToCreate.map(i => ({
          name: i.name,
          unit: i.unit,
          value: i.value,
        })),
      },
      // --- STEPS ---
      steps: {
        deleteMany: stepsToDelete.map(id => ({ id })),
        update: stepsToUpdate.map(s => ({
          where: { id: s.id },
          data: {
            description: s.description,
            image: s.image,
          },
        })),
        create: stepsToCreate.map(s => ({
          description: s.description,
          image: s.image,
        })),
      },
      // --- TAGS ---
      tags: {
        deleteMany: tagsToDelete.map(id => ({ id })),
        update: tagsToUpdate.map(t => ({
          where: { id: t.id },
          data: {
            value: t.value,
          },
        })),
        create: tagsToCreate.map(t => ({
          value: t.value,
        })),
      },
    };

    // Filtrer les champs undefined/null pour éviter les erreurs Prisma
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    console.log('Data to update:', JSON.stringify(data, null, 2));

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data,
      include: {
        ingredients: true,
        steps: true,
        tags: true,
        owner: { select: { id: true, name: true } },
      },
    });

    // Transform ingredients to include both name and displayName for response
    const recipeWithDisplayNames = {
      ...updatedRecipe,
      ingredients: updatedRecipe.ingredients.map(ingredient => ({
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
    console.error("Erreur lors de la mise à jour de la recette:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
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
          select: { id: true, name: true },
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
          select: { id: true, name: true },
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

// TOGGLE Best tag on recipe (admin only)
export const toggleBestTag = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non autorisé" });
  if (!req.user.isAdmin) return res.status(403).json({ message: "Accès réservé aux administrateurs" });

  const recipeId = Number(req.params.id);
  if (isNaN(recipeId)) {
    return res.status(400).json({ message: "ID de recette invalide" });
  }

  try {
    // Vérifier si la recette existe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { tags: true }
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée" });
    }

    // Trouver le tag Best existant
    const existingBestTag = recipe.tags.find(tag => tag.value === 'Best');

    if (req.method === 'POST') {
      // Ajouter le tag Best
      if (existingBestTag) {
        return res.status(400).json({ message: "Cette recette a déjà le tag Best" });
      }

      const newTag = await prisma.tag.create({
        data: {
          value: 'Best',
          recipeId: recipeId
        }
      });

      res.status(201).json({
        message: "Tag Best ajouté avec succès",
        tag: newTag,
        action: "added"
      });
    } else if (req.method === 'DELETE') {
      // Supprimer le tag Best
      if (!existingBestTag) {
        return res.status(404).json({ message: "Cette recette n'a pas le tag Best" });
      }

      await prisma.tag.delete({
        where: { id: existingBestTag.id }
      });

      res.json({
        message: "Tag Best supprimé avec succès",
        action: "removed"
      });
    } else {
      res.status(405).json({ message: "Méthode non autorisée" });
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du tag Best:', error);
    res.status(500).json({ error: "Erreur lors de la gestion du tag Best" });
  }
};
