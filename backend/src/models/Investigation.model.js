const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['urgency', 'impersonation', 'financial_lure', 'link', 'personal_info_request', 'threat', 'prize', 'other'],
    required: true
  },
  description: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  snippet: String // the exact text that triggered this evidence
});

const investigationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Input
  inputText: {
    type: String,
    required: [true, 'Input text is required'],
    maxlength: [5000, 'Input text cannot exceed 5000 characters']
  },
  inputType: {
    type: String,
    enum: ['message', 'email', 'url', 'social_post', 'call_description'],
    default: 'message'
  },
  // Scam DNA - pattern fingerprint
  scamDNA: {
    scamType: {
      type: String,
      enum: ['phishing', 'romance_scam', 'lottery_scam', 'tech_support', 'investment_fraud', 'impersonation', 'job_scam', 'unknown', 'legitimate'],
    },
    confidence: { type: Number, min: 0, max: 100 },
    patterns: [String],
    evidence: [evidenceSchema],
    redFlags: [String]
  },
  // Trust Score
  trustScore: {
    score: { type: Number, min: 0, max: 100 },
    label: {
      type: String,
      enum: ['safe', 'suspicious', 'likely_scam', 'confirmed_scam']
    },
    explanation: String
  },
  // AI Recommendation
  recommendation: {
    action: {
      type: String,
      enum: ['safe_to_proceed', 'proceed_with_caution', 'do_not_respond', 'block_and_report']
    },
    advice: String,
    steps: [String]
  },
  // Metadata
  processingTime: Number, // in ms
  aiModel: String,
  isShared: { type: Boolean, default: false },
  userFeedback: {
    wasHelpful: Boolean,
    actualOutcome: String
  }
}, {
  timestamps: true
});

// Index for faster queries
investigationSchema.index({ userId: 1, createdAt: -1 });
investigationSchema.index({ 'trustScore.label': 1 });

module.exports = mongoose.model('Investigation', investigationSchema);
