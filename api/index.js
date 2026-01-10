import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dogsRoutes from './routes/dogs.routes.js';
import walkRequestsRoutes from './routes/walk-requests.routes.js';
import offersRoutes from './routes/offers.routes.js';
import walkAssignmentsRoutes from './routes/walk-assignments.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import socialRoutes from './routes/social.routes.js';
import messageRoutes from './routes/messages.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import legalRoutes from './routes/legal.routes.js';
import walkerVerificationRoutes from './routes/walker-verification.routes.js';
import supportRoutes from './routes/support.routes.js';
import walkerRoutes from './routes/walker.routes.js';
import savedAddressesRoutes from './routes/saved-addresses.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { debugDatabase } from './controllers/debug.controller.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting on Render
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'https://dog-walk-phi.vercel.app',
    'http://localhost:5173'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dog Walking API is running' });
});

// Temporary debug route
app.get('/api/debug-db', debugDatabase);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dogs', dogsRoutes);
app.use('/api/walk-requests', walkRequestsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/walk-assignments', walkAssignmentsRoutes);
app.use('/api', trackingRoutes); // Mount at root API level to match /walk-assignments/:id/location path defined in router
app.use('/api/reviews', reviewsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/walker-verification', walkerVerificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/walker', walkerRoutes);
app.use('/api/saved-addresses', savedAddressesRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server only if not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;
