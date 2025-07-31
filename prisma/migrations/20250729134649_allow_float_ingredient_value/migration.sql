/*
  Warnings:

  - You are about to alter the column `value` on the `Ingredient` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `thermostat` on the `Recipe` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "value" REAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ingredient" ("id", "name", "recipeId", "unit", "value") SELECT "id", "name", "recipeId", "unit", "value" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE TABLE "new_Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "preparation_time" INTEGER NOT NULL,
    "baking_time" INTEGER,
    "thermostat" INTEGER,
    "resting_time" INTEGER,
    "number_of_persons" INTEGER NOT NULL,
    "link" TEXT,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("baking_time", "date", "id", "image", "link", "name", "number_of_persons", "ownerId", "preparation_time", "resting_time", "thermostat") SELECT "baking_time", "date", "id", "image", "link", "name", "number_of_persons", "ownerId", "preparation_time", "resting_time", "thermostat" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
