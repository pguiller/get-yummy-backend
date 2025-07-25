import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const EXPIRES_IN = '7d';

interface TokenPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

/**
 * Génère un token JWT pour un utilisateur
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
