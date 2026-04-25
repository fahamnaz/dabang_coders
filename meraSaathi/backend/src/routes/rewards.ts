import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Badge definitions
const BADGE_TIERS = [
  { id: 'beginner', emoji: '🥉', name: 'Beginner Badge', threshold: 10 },
  { id: 'explorer', emoji: '🥈', name: 'Explorer Badge', threshold: 50 },
  { id: 'champion', emoji: '🥇', name: 'Champion Badge', threshold: 100 },
  { id: 'legend', emoji: '🏆', name: 'Legend Badge', threshold: 250 },
  { id: 'master', emoji: '👑', name: 'Master Badge', threshold: 500 },
];

// ─── GET REWARDS SUMMARY ────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { totalStars: 1, badges: 1, streakDays: 1, totalPlayTimeMinutes: 1 } }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Calculate next badge
    const currentBadges = user.badges || [];
    const earnedIds = currentBadges.map((b: any) => b.id);
    const nextBadge = BADGE_TIERS.find(b => !earnedIds.includes(b.id) && (user.totalStars || 0) < b.threshold);

    res.json({
      totalStars: user.totalStars || 0,
      badges: currentBadges,
      streakDays: user.streakDays || 0,
      totalPlayTimeMinutes: user.totalPlayTimeMinutes || 0,
      nextBadge: nextBadge ? {
        ...nextBadge,
        starsNeeded: nextBadge.threshold - (user.totalStars || 0),
      } : null,
      allBadgeTiers: BADGE_TIERS,
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards.' });
  }
});

// ─── CHECK FOR NEW BADGES ───────────────────────────────────
router.post('/check-badges', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { totalStars: 1, badges: 1 } }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const currentBadges: any[] = user.badges || [];
    const earnedIds = new Set(currentBadges.map((b: any) => b.id));
    const newBadges: any[] = [];
    const now = new Date();

    for (const tier of BADGE_TIERS) {
      if (!earnedIds.has(tier.id) && (user.totalStars || 0) >= tier.threshold) {
        const badge = { ...tier, earnedAt: now.toISOString() };
        newBadges.push(badge);
        currentBadges.push(badge);
      }
    }

    if (newBadges.length > 0) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(req.userId) },
        { $set: { badges: currentBadges } }
      );

      // Create notification for each new badge
      const notifications = newBadges.map(badge => ({
        userId: new ObjectId(req.userId),
        title: `${user.childName || 'Your child'} earned the ${badge.name}!`,
        detail: `Reached ${badge.threshold} total stars. ${badge.emoji}`,
        tone: 'success',
        emoji: badge.emoji,
        isRead: false,
        createdAt: now,
      }));

      await db.collection('notifications').insertMany(notifications);
    }

    res.json({
      newBadges,
      allBadges: currentBadges,
      totalStars: user.totalStars || 0,
    });
  } catch (error) {
    console.error('Check badges error:', error);
    res.status(500).json({ error: 'Failed to check badges.' });
  }
});

export default router;
