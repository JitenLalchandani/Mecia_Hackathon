const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investigationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investigation',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    maxlength: 120,
    trim: true
  },
  summary: { type: String, maxlength: 500 },
  tags: [{ type: String, lowercase: true, trim: true }],
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

reportSchema.pre('save', function (next) {
  if (this.isPublic && !this.shareToken) {
    this.shareToken = uuidv4().replace(/-/g, '').slice(0, 16);
  }
  if (!this.isPublic) this.shareToken = undefined;
  next();
});

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ shareToken: 1 });

module.exports = mongoose.model('Report', reportSchema);
