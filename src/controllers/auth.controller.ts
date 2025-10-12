import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { sendEmail } from '../utils/sendEmail';
import { generatePasswordResetEmail } from '../utils/emailTemplates';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Pseudo, mail et mot de passe sont obligatoires.' });
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Mail déjà utilisé.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, status: 'active' },
    select: { id: true, name: true, email: true, password: true, status: true, isAdmin: true }
  });
  const { password: _, isAdmin: __, ...userWithoutSensitiveData } = user;
  res.status(201).json({ message: 'Compte utilisateur créé avec succès.', data: userWithoutSensitiveData });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Le mail et le mot de passe sont obligatoires.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Mail ou mot de passe invalide.' });
  }

  // Generate refresh token ID
  const refreshTokenId = crypto.randomBytes(32).toString('hex');
  
  // Generate tokens
  const accessToken = generateAccessToken({ 
    userId: user.id, 
    email: user.email, 
    isAdmin: user.isAdmin 
  });
  
  const refreshToken = generateRefreshToken({ 
    userId: user.id, 
    tokenId: refreshTokenId 
  });

  // Store refresh token in database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenId,
      userId: user.id,
      expiresAt,
    },
  });

  // Set cookies
  res.cookie('token', accessToken, { 
    httpOnly: true, 
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, { 
    httpOnly: true, 
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const { password: _, isAdmin: __, ...userWithoutSensitiveData } = user;
  res.json({ 
    message: 'Connecté.e avec succès.', 
    data: userWithoutSensitiveData, 
    accessToken,
    refreshToken 
  });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      // Revoke the refresh token in the database
      await prisma.refreshToken.updateMany({
        where: { 
          token: decoded.tokenId,
          userId: decoded.userId,
          isRevoked: false
        },
        data: { isRevoked: true }
      });
    } catch (error) {
      // If refresh token is invalid, just continue with logout
      console.log('Invalid refresh token during logout:', error);
    }
  }
  
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token requis' });
  }

  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if the refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: decoded.tokenId,
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      isAdmin: storedToken.user.isAdmin
    });

    // Set new access token cookie
    res.cookie('token', newAccessToken, { 
      httpOnly: true, 
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({ 
      message: 'Token rafraîchi avec succès',
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(401).json({ message: 'Refresh token invalide' });
  }
};

export const cleanupTokens = async (req: Request, res: Response) => {
  try {
    const { cleanupExpiredTokens } = await import('../utils/tokenCleanup');
    const cleanedCount = await cleanupExpiredTokens();
    
    res.json({ 
      message: `Nettoyage terminé. ${cleanedCount} tokens supprimés.`,
      cleanedCount 
    });
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    res.status(500).json({ message: 'Erreur lors du nettoyage des tokens' });
  }
};

export const getTokenStats = async (req: Request, res: Response) => {
  try {
    const { getTokenStats } = await import('../utils/tokenCleanup');
    const stats = await getTokenStats();
    
    res.json({ 
      message: 'Statistiques des tokens récupérées',
      stats 
    });
  } catch (error) {
    console.error('Error getting token stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

export const sendResetPasswordEmail = async (userEmail: string, token: string) => {
  const resetLink = `${process.env.FRONT_URL}/mot-de-passe-oublie?token=${token}`;

  const html = `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour le faire :</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>Ce lien expirera dans 1h.</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: '[Get Yummy] Réinitialisation de votre mot de passe',
    html,
  });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email est requis.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour to match email

    // Supprimer tous les anciens tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Enregistrer le nouveau token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

        const frontendUrl = process.env.FRONT_URL || 'http://localhost:3000';
    console.log('Frontend URL:', frontendUrl);
    console.log('Environment variable FRONT_URL:', process.env.FRONT_URL);
    const resetLink = `${frontendUrl}/mot-de-passe-oublie?token=${token}`;

    const html = generatePasswordResetEmail(user.name, user.email, resetLink);

    await sendEmail({
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe - Get Yummy',
      html,
    });

    return res.status(200).json({ message: 'E-mail de réinitialisation envoyé.' });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe sont requis.' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Le mot de passe doit inclure au moins une lettre majuscule.' });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Le mot de passe doit inclure au moins une lettre minuscule.' });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Le mot de passe doit inclure au moins un chiffre.' });
    }

    if (!/^(?=.*[$&+,:;=?@#|'<>.^*()%!-])/.test(newPassword)) {
      return res.status(400).json({ message: 'Le mot de passe doit inclure au moins un caractère spécial.' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
