import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// ─── ADAPTIVE LEARNING ALGORITHM ────────────────────────────
// Q-Learning inspired: computes a performanceScore from accuracy, speed, and streaks
// then maps it to a difficulty band.

interface AdaptiveEvent {
  levelId: string;
  correct: boolean;
  timeSeconds: number;
  attempts: number;
  pronunciationScore?: number; // For speech games
  at: string;
}

interface AdaptiveProfile {
  userId: ObjectId;
  gameId: string;
  performanceScore: number;       // 0.0 to 1.0
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  recentEvents: AdaptiveEvent[];  // Rolling window of last 10
  consecutiveCorrect: number;
  totalEvents: number;
  updatedAt: Date;
}

const EXPECTED_TIME_SECONDS: Record<string, number> = {
  'speech-playground': 15,   // Expected seconds per speech level
  'build-equation': 120,     // Expected seconds per math level
};

const ROLLING_WINDOW = 10;

function computePerformanceScore(events: AdaptiveEvent[], gameId: string): number {
  if (events.length === 0) return 0.0;

  // 1. Accuracy component (40% weight)
  const correctCount = events.filter(e => e.correct).length;
  const accuracy = correctCount / events.length;

  // 2. Speed component (30% weight) — how fast vs expected time
  const expectedTime = EXPECTED_TIME_SECONDS[gameId] || 30;
  const avgTime = events.reduce((sum, e) => sum + e.timeSeconds, 0) / events.length;
  const speedBonus = Math.max(0, Math.min(1, 1 - (avgTime / (expectedTime * 2))));

  // 3. Streak component (30% weight) — consecutive correct answers
  let streak = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].correct) streak++;
    else break;
  }
  const streakBonus = Math.min(streak / 3, 1);

  // 4. Pronunciation bonus for speech games (replaces speed for speech)
  let pronunciationBonus = 0;
  const speechEvents = events.filter(e => e.pronunciationScore !== undefined);
  if (speechEvents.length > 0) {
    pronunciationBonus = speechEvents.reduce((sum, e) => sum + (e.pronunciationScore || 0), 0) / speechEvents.length / 100;
  }

  let score: number;
  if (speechEvents.length > 0) {
    // Speech games: accuracy(35%) + pronunciation(35%) + streak(30%)
    score = (accuracy * 0.35) + (pronunciationBonus * 0.35) + (streakBonus * 0.30);
  } else {
    // Other games: accuracy(40%) + speed(30%) + streak(30%)
    score = (accuracy * 0.40) + (speedBonus * 0.30) + (streakBonus * 0.30);
  }

  return Math.max(0, Math.min(1, score));
}

function scoreTodifficulty(score: number): 'easy' | 'medium' | 'hard' {
  if (score >= 0.70) return 'hard';
  if (score >= 0.40) return 'medium';
  return 'easy';
}

// ─── GET ADAPTIVE RECOMMENDATION ────────────────────────────
router.get('/:gameId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.userId);
    const gameId = req.params.gameId;

    const profile = await db.collection('adaptive_profiles').findOne({ userId, gameId });

    if (!profile) {
      res.json({
        performanceScore: 0,
        recommendedDifficulty: 'easy',
        consecutiveCorrect: 0,
        totalEvents: 0,
        message: 'New learner — starting at easy difficulty.',
      });
      return;
    }

    // Adaptive message based on performance
    let message = '';
    if (profile.performanceScore >= 0.70) {
      message = 'Amazing progress! Challenging you with harder content! 🚀';
    } else if (profile.performanceScore >= 0.40) {
      message = 'Great work! Keeping you at a balanced level! 💪';
    } else {
      message = 'Let\'s practice more! Taking it nice and easy! 🌟';
    }

    res.json({
      performanceScore: profile.performanceScore,
      recommendedDifficulty: profile.recommendedDifficulty,
      consecutiveCorrect: profile.consecutiveCorrect,
      totalEvents: profile.totalEvents,
      message,
    });
  } catch (error) {
    console.error('Adaptive get error:', error);
    res.status(500).json({ error: 'Failed to get adaptive recommendation.' });
  }
});

// ─── RECORD PERFORMANCE EVENT ───────────────────────────────
router.post('/:gameId/record', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { levelId, correct, timeSeconds, attempts, pronunciationScore } = req.body;

    if (levelId === undefined || correct === undefined) {
      res.status(400).json({ error: 'levelId and correct are required.' });
      return;
    }

    const db = getDb();
    const userId = new ObjectId(req.userId);
    const gameId = req.params.gameId;
    const now = new Date();

    const newEvent: AdaptiveEvent = {
      levelId,
      correct: Boolean(correct),
      timeSeconds: timeSeconds || 0,
      attempts: attempts || 1,
      pronunciationScore: pronunciationScore !== undefined ? pronunciationScore : undefined,
      at: now.toISOString(),
    };

    // Find or create adaptive profile
    const existing = await db.collection('adaptive_profiles').findOne({ userId, gameId });

    let recentEvents: AdaptiveEvent[];
    let consecutiveCorrect: number;
    let totalEvents: number;

    if (existing) {
      recentEvents = [...(existing.recentEvents || []), newEvent].slice(-ROLLING_WINDOW);
      consecutiveCorrect = correct ? (existing.consecutiveCorrect || 0) + 1 : 0;
      totalEvents = (existing.totalEvents || 0) + 1;
    } else {
      recentEvents = [newEvent];
      consecutiveCorrect = correct ? 1 : 0;
      totalEvents = 1;
    }

    // Recompute performance score using the rolling window
    const performanceScore = computePerformanceScore(recentEvents, gameId);
    const recommendedDifficulty = scoreTodifficulty(performanceScore);

    await db.collection('adaptive_profiles').updateOne(
      { userId, gameId },
      {
        $set: {
          performanceScore,
          recommendedDifficulty,
          recentEvents,
          consecutiveCorrect,
          totalEvents,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    // Adaptive feedback message
    let feedback = '';
    const prevDifficulty = existing?.recommendedDifficulty || 'easy';
    if (recommendedDifficulty !== prevDifficulty) {
      if (recommendedDifficulty === 'hard') feedback = 'Level up! You\'re ready for a challenge! 🔥';
      else if (recommendedDifficulty === 'medium') feedback = correct ? 'Moving up! Great progress! 💪' : 'Let\'s find your sweet spot! 🎯';
      else feedback = 'Let\'s build your confidence first! 🌱';
    }

    res.json({
      performanceScore: Math.round(performanceScore * 100) / 100,
      recommendedDifficulty,
      consecutiveCorrect,
      totalEvents,
      difficultyChanged: recommendedDifficulty !== prevDifficulty,
      feedback,
    });
  } catch (error) {
    console.error('Adaptive record error:', error);
    res.status(500).json({ error: 'Failed to record adaptive event.' });
  }
});

// ─── GET FULL ADAPTIVE ANALYTICS ────────────────────────────
router.get('/:gameId/analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.userId);
    const gameId = req.params.gameId;

    const profile = await db.collection('adaptive_profiles').findOne({ userId, gameId });

    if (!profile) {
      res.json({ analytics: null });
      return;
    }

    // Compute detailed analytics from recent events
    const events = profile.recentEvents || [];
    const correctEvents = events.filter((e: AdaptiveEvent) => e.correct);
    const avgTime = events.length > 0 ? events.reduce((s: number, e: AdaptiveEvent) => s + e.timeSeconds, 0) / events.length : 0;
    const avgAttempts = events.length > 0 ? events.reduce((s: number, e: AdaptiveEvent) => s + e.attempts, 0) / events.length : 0;

    res.json({
      analytics: {
        performanceScore: profile.performanceScore,
        recommendedDifficulty: profile.recommendedDifficulty,
        totalEvents: profile.totalEvents,
        recentAccuracy: events.length > 0 ? Math.round((correctEvents.length / events.length) * 100) : 0,
        avgTimePerLevel: Math.round(avgTime),
        avgAttemptsPerLevel: Math.round(avgAttempts * 10) / 10,
        consecutiveCorrect: profile.consecutiveCorrect,
        learningTrend: profile.performanceScore >= 0.6 ? 'improving' : profile.performanceScore >= 0.3 ? 'steady' : 'needs-practice',
      },
    });
  } catch (error) {
    console.error('Adaptive analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics.' });
  }
});

export default router;
