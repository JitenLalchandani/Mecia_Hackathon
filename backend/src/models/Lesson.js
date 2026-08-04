// backend/src/models/Lesson.js
const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Phishing', 'Passwords', 'Social Engineering'], required: true },
  content: { type: String, required: true },
  tipOfDay: { type: String },
  quiz: [{
    question: String,
    options: [String],
    correctAnswer: Number
  }]
});

module.exports = mongoose.model('Lesson', LessonSchema);
