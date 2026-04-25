// const dns = require('node:dns');
// dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const GameSession = require('./models/GameSession');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB (optional — app works without it)
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('⚠️  MongoDB unavailable (scores won\'t persist):', err.message));

// ── Log a completed game session ──
app.post('/api/session', async (req, res) => {
  const { category, mode, score, totalQuestions, correctAnswers } = req.body;

  if (!category || !mode || score === undefined) {
    return res.status(400).json({ error: 'category, mode, and score are required' });
  }

  try {
    const session = new GameSession({
      category,
      mode,
      score,
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0
    });
    await session.save();
    console.log(`[SESSION] ${category} | ${mode} | Score: ${score} | ${correctAnswers}/${totalQuestions}`);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Retrieve past sessions (for caregiver dashboard) ──
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await GameSession.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 });
});

app.listen(PORT, () => {
  console.log(`🟢 Play Gugglu Backend on http://localhost:${PORT}`);
});
