import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth.js';

const router = Router();

// ─── SIGNUP ─────────────────────────────────────────────────
router.post('/signup', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, childName } = req.body;

    if (!email || !password || !childName) {
      res.status(400).json({ error: 'Email, password, and child name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = getDb();
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = {
      email: email.toLowerCase(),
      passwordHash,
      childName,
      avatarEmoji: '🧒',
      age: null,
      ageBand: null,
      preferredModality: null,
      interests: [],
      learningGoals: [],
      confidence: 0.40,
      totalStars: 0,
      totalPlayTimeMinutes: 0,
      badges: [],
      streakDays: 0,
      lastActiveAt: new Date(),
      onboarded: false,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    const token = generateToken(result.insertedId.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      user: { ...userWithoutPassword, _id: result.insertedId },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

// ─── LOGIN ──────────────────────────────────────────────────
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Update last active and streak
    const now = new Date();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : now;
    const daysSinceLastActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let streakDays = user.streakDays || 0;
    if (daysSinceLastActive === 1) {
      streakDays += 1; // Consecutive day
    } else if (daysSinceLastActive > 1) {
      streakDays = 1; // Streak broken
    }
    // If daysSinceLastActive === 0, keep the same streak (same day login)

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastActiveAt: now, streakDays } }
    );

    const token = generateToken(user._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({
      user: { ...userWithoutPassword, streakDays },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// ─── GET CURRENT USER ───────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── UPDATE PROFILE (Onboarding Data) ──────────────────────
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { age, interests, learningGoals, avatarEmoji } = req.body;

    const db = getDb();
    const updateData: Record<string, unknown> = { onboarded: true };

    if (age !== undefined) {
      updateData.age = age;
      updateData.ageBand = age <= 5 ? 'preschool' : 'early_primary';
    }
    if (interests) {
      updateData.interests = interests;
      updateData.preferredModality = interests.includes('music') || interests.includes('stories')
        ? 'auditory' : 'visual';
    }
    if (learningGoals) updateData.learningGoals = learningGoals;
    if (avatarEmoji) updateData.avatarEmoji = avatarEmoji;

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: updateData }
    );

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { passwordHash: 0 } }
    );

    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────────
router.post('/logout', (_req: AuthRequest, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

export default router;
