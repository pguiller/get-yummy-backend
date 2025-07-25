import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

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
