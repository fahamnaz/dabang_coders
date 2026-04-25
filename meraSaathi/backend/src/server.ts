import express, { Request, Response } from 'express';
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
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL, // Add your Vercel URL here in Render Settings
].filter(Boolean) as string[];

app.use(cors({
  origin: true, // Temporarily allow all origins for debugging
  credentials: true,
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
app.get('/api/health', (_req: Request, res: Response) => {
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
