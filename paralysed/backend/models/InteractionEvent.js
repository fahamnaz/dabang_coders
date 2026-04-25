const mongoose = require('mongoose');

const interactionEventSchema = new mongoose.Schema({
  requestedItem: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InteractionEvent', interactionEventSchema);
