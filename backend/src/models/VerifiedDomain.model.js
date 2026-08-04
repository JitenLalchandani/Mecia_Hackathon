const mongoose = require('mongoose');
const crypto   = require('crypto');

/**
 * VerifiedDomain
 * A user must verify ownership of a domain before CyberTwin will scan it.
 * Verification methods:
 *   - dns_txt   : add a TXT record  _cybertwin-verify.<domain> = <token>
 *   - file      : serve the token at https://<domain>/.well-known/cybertwin-verify.txt
 *
 * Status flow:
 *   pending_verification → verified | failed
 */
const verifiedDomainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true,
    lowercase: true,
    match: [
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      'Please enter a valid domain (e.g. example.com)'
    ]
  },
  // Randomly generated token — user must place this in DNS or a file
  verificationToken: {
    type: String,
    required: true
  },
  verificationMethod: {
    type: String,
    enum: ['dns_txt', 'file'],
    default: 'dns_txt'
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'failed'],
    default: 'pending_verification'
  },
  verifiedAt:      Date,
  lastScannedAt:   Date,
  failureReason:   String,

  // User's explicit consent — stored permanently
  consentGiven:    { type: Boolean, required: true, default: false },
  consentGivenAt:  Date,
  consentText:     { type: String } // exact text they agreed to, for audit trail
}, {
  timestamps: true
});

// One domain per user
verifiedDomainSchema.index({ userId: 1, domain: 1 }, { unique: true });

// Auto-generate verification token on creation
verifiedDomainSchema.pre('save', function (next) {
  if (!this.verificationToken) {
    this.verificationToken = 'cybertwin-verify=' + crypto.randomBytes(20).toString('hex');
  }
  next();
});

module.exports = mongoose.model('VerifiedDomain', verifiedDomainSchema);
