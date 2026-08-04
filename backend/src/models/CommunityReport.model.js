const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scamType: { type: String, required: true },
  description: { type: String, required: true },
  indicators: [String],
  upvotes: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('CommunityReport', communityReportSchema);