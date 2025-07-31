/*
  Warnings:

  - You are about to drop the column `baking_time_unit` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `baking_time_value` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `preparation_time_unit` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `preparation_time_value` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `resting_time_unit` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `resting_time_value` on the `Recipe` table. All the data in the column will be lost.
  - Added the required column `preparation_time` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "preparation_time" INTEGER NOT NULL,
    "baking_time" INTEGER,
    "thermostat" TEXT,
    "resting_time" INTEGER,
    "number_of_persons" INTEGER NOT NULL,
    "link" TEXT,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("date", "id", "image", "link", "name", "number_of_persons", "ownerId", "thermostat") SELECT "date", "id", "image", "link", "name", "number_of_persons", "ownerId", "thermostat" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
