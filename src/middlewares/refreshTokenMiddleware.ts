import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import prisma from '../prisma/client';

export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  // If no access token, try to use refresh token
  if (!accessToken && refreshToken) {
    try {
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

      if (storedToken) {
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

        // Continue with the request
        next();
        return;
      }
    } catch (error) {
      // If refresh token is invalid, continue without authentication
      console.log('Invalid refresh token in middleware:', error);
    }
  }

  // If we have an access token, try to verify it
  if (accessToken) {
    try {
      verifyAccessToken(accessToken);
      next();
      return;
    } catch (error) {
      // Access token is invalid or expired
      console.log('Invalid access token in middleware:', error);
    }
  }

  // If we reach here, no valid tokens found
  next();
}; 