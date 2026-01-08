import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints (register, login)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Relaxed for deployment testing
    message: { error: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});
