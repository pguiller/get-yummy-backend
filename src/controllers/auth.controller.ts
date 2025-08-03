import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { sendEmail } from '../utils/sendEmail';
import { generatePasswordResetEmail } from '../utils/emailTemplates';
import crypto from 'crypto';

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
  const token = jwt.sign({ userId: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  const { password: _, isAdmin: __, ...userWithoutSensitiveData } = user;
  res.json({ message: 'Connecté.e avec succès.', data: userWithoutSensitiveData, token });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
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
