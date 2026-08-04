const mongoose = require('mongoose');

const portSchema = new mongoose.Schema({
  port:     Number,
  protocol: String,        // tcp | udp
  state:    String,        // open | closed | filtered
  service:  String,        // http, https, ssh, ftp...
  version:  String,        // service version if detected
  risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskReason: String       // human-readable reason for risk level
}, { _id: false });

const scanResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedDomainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifiedDomain',
    required: true
  },
  domain:    { type: String, required: true },
  ipAddress: String,

  // Scan config
  scanType: {
    type: String,
    enum: ['quick', 'standard', 'full'],
    default: 'quick'
  },
  // Scan output
  ports:         [portSchema],
  osGuess:       String,
  hostStatus:    { type: String, enum: ['up', 'down', 'unknown'], default: 'unknown' },
  rawOutput:     String,   // full nmap stdout (truncated at 10kb)

  // Security summary — generated from scan results
  securitySummary: {
    riskLevel:        { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    openPortCount:    Number,
    criticalFindings: [String],
    recommendations:  [String]
  },

  // Adaptive summary per profile type
  adaptiveSummary: {
    explanation:     String,
    advice:          String,
    steps:           [String]
  },

  scanDurationMs: Number,
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  errorMessage: String,

  // Consent snapshot at time of scan
  consentConfirmedAt: Date
}, {
  timestamps: true
});

scanResultSchema.index({ userId: 1, createdAt: -1 });
scanResultSchema.index({ verifiedDomainId: 1 });

module.exports = mongoose.model('ScanResult', scanResultSchema);
