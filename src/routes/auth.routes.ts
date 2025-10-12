import express from 'express';
import { register, login, logout, refresh, requestPasswordReset, resetPassword, cleanupTokens, getTokenStats } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/cleanup-tokens', cleanupTokens);
router.get('/token-stats', getTokenStats);

export default router;
