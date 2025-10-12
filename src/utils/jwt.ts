import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshsupersecretkey';

// Access token expires in 15 minutes
const ACCESS_TOKEN_EXPIRES_IN = '15m';
// Refresh token expires in 7 days
const REFRESH_TOKEN_EXPIRES_IN = '7d';

interface TokenPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
}

/**
 * Génère un access token JWT pour un utilisateur
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * Génère un refresh token JWT pour un utilisateur
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Vérifie et décode un access token JWT
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Vérifie et décode un refresh token JWT
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

/**
 * Génère un token JWT pour un utilisateur (backward compatibility)
 * @deprecated Use generateAccessToken instead
 */
export function generateToken(payload: TokenPayload): string {
  return generateAccessToken(payload);
}

/**
 * Vérifie et décode un token JWT (backward compatibility)
 * @deprecated Use verifyAccessToken instead
 */
export function verifyToken(token: string): TokenPayload {
  return verifyAccessToken(token);
}
