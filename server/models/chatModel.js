// models/Chat_v2d.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['vendor', 'driver'], required: true },
    name: { type: String, required: true }
  },
  to: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['vendor', 'driver'], required: true },
    name: { type: String, required: true }
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  member1: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['vendor', 'driver'], required: true },
    name: { type: String, required: true }
  },
  member2: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['vendor', 'driver'], required: true },
    name: { type: String, required: true }
  },
  chats: [messageSchema],
}, {
  collection: 'Chat_v2d',
  timestamps: true
});

module.exports = mongoose.model('Chat_v2d', chatSchema);