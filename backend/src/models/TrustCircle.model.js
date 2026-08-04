const mongoose = require('mongoose');

/**
 * TrustCircle — social trust network
 * Users can add trusted contacts; investigations can be shared with the circle.
 * A connection is ONE document (requester → recipient).
 * Status: pending → accepted | declined | blocked
 */
const trustCircleSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  // Optional message when sending the request
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // When the recipient responded
  respondedAt: Date
}, {
  timestamps: true
});

// A pair can only have one connection document
trustCircleSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Fast lookups for both directions
trustCircleSchema.index({ recipient: 1, status: 1 });
trustCircleSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model('TrustCircle', trustCircleSchema);
