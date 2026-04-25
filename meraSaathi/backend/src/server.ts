import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectToDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import progressRoutes from './routes/progress.js';
import rewardsRoutes from './routes/rewards.js';
import notificationsRoutes from './routes/notifications.js';
import adaptiveRoutes from './routes/adaptive.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000'
  ],
  credentials: true, // Required for cookies
}));
app.use(express.json());
app.use(cookieParser());

// ─── ROUTES ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/adaptive', adaptiveRoutes);

// ─── HEALTH CHECK ───────────────────────────────────────────
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── START ──────────────────────────────────────────────────
async function start() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 PlaySpark API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch(console.error);
