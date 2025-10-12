import prisma from '../prisma/client';

/**
 * Clean up expired and revoked refresh tokens
 * This function should be called periodically (e.g., daily via cron job)
 */
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired tokens
          { isRevoked: true } // Revoked tokens
        ]
      }
    });

    console.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

/**
 * Get statistics about refresh tokens
 */
export const getTokenStats = async () => {
  try {
    const [total, active, expired, revoked] = await Promise.all([
      prisma.refreshToken.count(),
      prisma.refreshToken.count({
        where: {
          expiresAt: { gt: new Date() },
          isRevoked: false
        }
      }),
      prisma.refreshToken.count({
        where: {
          expiresAt: { lt: new Date() }
        }
      }),
      prisma.refreshToken.count({
        where: {
          isRevoked: true
        }
      })
    ]);

    return {
      total,
      active,
      expired,
      revoked
    };
  } catch (error) {
    console.error('Error getting token stats:', error);
    throw error;
  }
}; 