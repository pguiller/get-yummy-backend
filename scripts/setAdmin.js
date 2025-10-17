const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setUserAsAdmin(userId) {
  try {
    console.log(`Tentative de définition de l'utilisateur ${userId} comme administrateur...`);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.error(`Utilisateur avec l'ID ${userId} non trouvé`);
      return;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true }
    });
    
    console.log('✅ Utilisateur défini comme administrateur:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Nom: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Admin: ${updatedUser.isAdmin}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la définition comme admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'ID depuis les arguments de ligne de commande
const userId = process.argv[2] || 1;
setUserAsAdmin(parseInt(userId));

