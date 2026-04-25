import { Router, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// ─── GET NOTIFICATIONS ──────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const notifications = await db.collection('notifications')
      .find({ userId: new ObjectId(req.userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Add relative time labels
    const withTime = notifications.map(n => ({
      ...n,
      time: getRelativeTime(n.createdAt),
    }));

    res.json({ notifications: withTime });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ─── CREATE NOTIFICATION ────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, detail, tone, emoji } = req.body;

    if (!title || !detail) {
      res.status(400).json({ error: 'Title and detail are required.' });
      return;
    }

    const db = getDb();
    const now = new Date();

    // Duplicate prevention: skip if same title+detail within 3 seconds
    const recentDuplicate = await db.collection('notifications').findOne({
      userId: new ObjectId(req.userId),
      title,
      detail,
      createdAt: { $gte: new Date(now.getTime() - 3000) },
    });

    if (recentDuplicate) {
      res.json({ notification: recentDuplicate, deduplicated: true });
      return;
    }

    const notification = {
      userId: new ObjectId(req.userId),
      title,
      detail,
      tone: tone || 'info',
      emoji: emoji || '🌟',
      isRead: false,
      createdAt: now,
    };

    const result = await db.collection('notifications').insertOne(notification);

    res.status(201).json({
      notification: { ...notification, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
});

// ─── MARK AS READ ───────────────────────────────────────────
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(req.userId) },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// ─── HELPER ─────────────────────────────────────────────────
function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default router;
