FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port de l’API
EXPOSE 4000

# Commande de démarrage pour la prod
CMD ["pnpm", "start"]
