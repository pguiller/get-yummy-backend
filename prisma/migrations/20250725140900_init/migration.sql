-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "preparation_time_value" INTEGER NOT NULL,
    "preparation_time_unit" TEXT NOT NULL,
    "baking_time_value" INTEGER,
    "baking_time_unit" TEXT,
    "thermostat" TEXT,
    "resting_time_value" INTEGER,
    "resting_time_unit" TEXT,
    "number_of_persons" INTEGER NOT NULL,
    "link" TEXT,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "value" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Step" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "recipeId" INTEGER NOT NULL,
    CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    CONSTRAINT "Tag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
