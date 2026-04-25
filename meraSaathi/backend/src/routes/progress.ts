import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth to all progress routes
router.use(authMiddleware);

// ─── GET ALL PROGRESS ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const progress = await db.collection('game_progress')
      .find({ userId: new ObjectId(req.userId) })
      .toArray();

    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

// ─── GET PROGRESS FOR SPECIFIC GAME ─────────────────────────
router.get('/:gameId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const progress = await db.collection('game_progress').findOne({
      userId: new ObjectId(req.userId),
      gameId: req.params.gameId,
    });

    if (!progress) {
      // Return empty progress for a game never started
      res.json({
        progress: {
          gameId: req.params.gameId,
          currentLevel: 0,
          maxLevelUnlocked: 0,
          starsEarned: 0,
          attemptsTotal: 0,
          correctTotal: 0,
          accuracy: 0,
          totalPlayTimeSeconds: 0,
          levelDetails: [],
        }
      });
      return;
    }

    res.json({ progress });
  } catch (error) {
    console.error('Get game progress error:', error);
    res.status(500).json({ error: 'Failed to fetch game progress.' });
  }
});

// ─── COMPLETE A LEVEL ───────────────────────────────────────
router.post('/:gameId/complete-level', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { levelId, levelIndex, stars, score, totalLevels, subjectId, details } = req.body;

    if (levelId === undefined || stars === undefined) {
      res.status(400).json({ error: 'levelId and stars are required.' });
      return;
    }

    const db = getDb();
    const userId = new ObjectId(req.userId);
    const gameId = req.params.gameId;
    const now = new Date();

    // Find or create progress document
    const existing = await db.collection('game_progress').findOne({ userId, gameId });

    const levelDetail = {
      levelId,
      status: 'completed' as const,
      stars: stars || 0,
      attempts: (existing?.levelDetails?.find((l: any) => l.levelId === levelId)?.attempts || 0) + 1,
      bestScore: Math.max(score || 0, existing?.levelDetails?.find((l: any) => l.levelId === levelId)?.bestScore || 0),
      completedAt: now.toISOString(),
    };

    if (existing) {
      // Update existing progress
      const levelDetails = [...(existing.levelDetails || [])];
      const existingLevelIdx = levelDetails.findIndex((l: any) => l.levelId === levelId);
      if (existingLevelIdx >= 0) {
        levelDetails[existingLevelIdx] = {
          ...levelDetails[existingLevelIdx],
          ...levelDetail,
          attempts: levelDetails[existingLevelIdx].attempts + 1,
          bestScore: Math.max(levelDetail.bestScore, levelDetails[existingLevelIdx].bestScore || 0),
        };
      } else {
        levelDetails.push(levelDetail);
      }

      const nextLevel = (levelIndex !== undefined ? levelIndex + 1 : (existing.currentLevel || 0) + 1);
      const maxUnlocked = Math.max(existing.maxLevelUnlocked || 0, nextLevel);
      const completedCount = levelDetails.filter((l: any) => l.status === 'completed').length;
      const totalAttempts = levelDetails.reduce((sum: number, l: any) => sum + (l.attempts || 0), 0);

      await db.collection('game_progress').updateOne(
        { userId, gameId },
        {
          $set: {
            currentLevel: nextLevel,
            maxLevelUnlocked: maxUnlocked,
            totalLevels: totalLevels || existing.totalLevels,
            levelDetails,
            attemptsTotal: totalAttempts,
            correctTotal: completedCount,
            accuracy: totalAttempts > 0 ? Math.round((completedCount / totalAttempts) * 100 * 10) / 10 : 0,
            lastPlayedAt: now,
            updatedAt: now,
          },
          $inc: {
            starsEarned: stars,
          }
        }
      );
    } else {
      // Create new progress document
      await db.collection('game_progress').insertOne({
        userId,
        gameId,
        subjectId: subjectId || null,
        currentLevel: (levelIndex !== undefined ? levelIndex + 1 : 1),
        maxLevelUnlocked: (levelIndex !== undefined ? levelIndex + 1 : 1),
        totalLevels: totalLevels || 0,
        starsEarned: stars,
        attemptsTotal: 1,
        correctTotal: 1,
        accuracy: 100,
        totalPlayTimeSeconds: 0,
        levelDetails: [levelDetail],
        lastPlayedAt: now,
        updatedAt: now,
      });
    }

    // Add stars to user total
    await db.collection('users').updateOne(
      { _id: userId },
      { $inc: { totalStars: stars } }
    );

    // Get updated progress
    const updatedProgress = await db.collection('game_progress').findOne({ userId, gameId });
    const updatedUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { passwordHash: 0 } }
    );

    res.json({
      progress: updatedProgress,
      totalStars: updatedUser?.totalStars || 0,
    });
  } catch (error) {
    console.error('Complete level error:', error);
    res.status(500).json({ error: 'Failed to save level progress.' });
  }
});

// ─── UPDATE MILESTONE PROGRESS (for endless games like Match Letters) ───
router.post('/:gameId/update-milestone', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { milestone, stars, totalScore, subjectId } = req.body;

    const db = getDb();
    const userId = new ObjectId(req.userId);
    const gameId = req.params.gameId;
    const now = new Date();

    await db.collection('game_progress').updateOne(
      { userId, gameId },
      {
        $set: {
          subjectId: subjectId || null,
          currentLevel: milestone,
          maxLevelUnlocked: milestone,
          lastPlayedAt: now,
          updatedAt: now,
        },
        $inc: {
          starsEarned: stars || 0,
          correctTotal: 1,
          attemptsTotal: 1,
        },
        $setOnInsert: {
          totalLevels: 0,
          accuracy: 0,
          totalPlayTimeSeconds: 0,
          levelDetails: [],
        }
      },
      { upsert: true }
    );

    // Add stars to user total
    if (stars) {
      await db.collection('users').updateOne(
        { _id: userId },
        { $inc: { totalStars: stars } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone.' });
  }
});

// ─── START SESSION ──────────────────────────────────────────
router.post('/:gameId/start-session', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { levelId } = req.body;
    const db = getDb();

    const session = {
      userId: new ObjectId(req.userId),
      gameId: req.params.gameId,
      levelId: levelId || null,
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: 0,
      starsEarned: 0,
      result: 'in-progress',
      details: {},
    };

    const result = await db.collection('game_sessions').insertOne(session);
    res.json({ sessionId: result.insertedId });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session.' });
  }
});

// ─── END SESSION ────────────────────────────────────────────
router.post('/:gameId/end-session', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, result, starsEarned, details } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }

    const db = getDb();
    const now = new Date();

    const session = await db.collection('game_sessions').findOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(req.userId),
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    const durationSeconds = Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000);

    await db.collection('game_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          endedAt: now,
          durationSeconds,
          result: result || 'completed',
          starsEarned: starsEarned || 0,
          details: details || {},
        }
      }
    );

    // Update total play time on progress
    await db.collection('game_progress').updateOne(
      { userId: new ObjectId(req.userId), gameId: req.params.gameId },
      { $inc: { totalPlayTimeSeconds: durationSeconds } }
    );

    // Update total play time on user
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $inc: { totalPlayTimeMinutes: Math.round(durationSeconds / 60) } }
    );

    res.json({ success: true, durationSeconds });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session.' });
  }
});

export default router;
