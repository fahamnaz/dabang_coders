const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['animals', 'colors', 'numbers', 'shapes']
  },
  mode: {
    type: String,
    required: true,
    enum: ['neck', 'eye']
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
