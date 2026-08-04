const TrustCircle = require('../models/TrustCircle.model');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

// ── Helper: fetch both directions for a user ─────────────────────────────────
const getConnectionsForUser = async (userId) => {
  const connections = await TrustCircle.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted'
  })
    .populate('requester', 'name email profileType investigationCount')
    .populate('recipient', 'name email profileType investigationCount');

  return connections.map(conn => {
    const isMine = conn.requester._id.toString() === userId.toString();
    const contact = isMine ? conn.recipient : conn.requester;
    return { connectionId: conn._id, contact, since: conn.createdAt };
  });
};

// @route   GET /api/trust-circle
// @desc    Get user's accepted circle members
const getMyCircle = asyncHandler(async (req, res) => {
  const members = await getConnectionsForUser(req.user._id);
  res.json({ success: true, count: members.length, data: members });
});

// @route   POST /api/trust-circle/invite
// @desc    Send a circle invite by email
const sendInvite = asyncHandler(async (req, res) => {
  const { email, message } = req.body;

  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  if (email.toLowerCase() === req.user.email.toLowerCase()) {
    return res.status(400).json({ success: false, message: "You can't add yourself" });
  }

  // Find recipient
  const recipient = await User.findOne({ email: email.toLowerCase() });
  if (!recipient) {
    return res.status(404).json({ success: false, message: 'No CyberTwin user found with that email' });
  }

  // Check for existing connection (either direction)
  const existing = await TrustCircle.findOne({
    $or: [
      { requester: req.user._id, recipient: recipient._id },
      { requester: recipient._id, recipient: req.user._id }
    ]
  });

  if (existing) {
    const statusMessages = {
      pending: 'A request is already pending between you two',
      accepted: 'This person is already in your circle',
      declined: 'This request was previously declined',
      blocked: 'Unable to send request'
    };
    return res.status(409).json({ success: false, message: statusMessages[existing.status] });
  }

  const invite = await TrustCircle.create({
    requester: req.user._id,
    recipient: recipient._id,
    message: message || ''
  });

  await invite.populate('recipient', 'name email profileType');

  res.status(201).json({
    success: true,
    message: `Invite sent to ${recipient.name}`,
    data: invite
  });
});

// @route   GET /api/trust-circle/requests
// @desc    Get pending requests (received by me)
const getPendingRequests = asyncHandler(async (req, res) => {
  const requests = await TrustCircle.find({
    recipient: req.user._id,
    status: 'pending'
  }).populate('requester', 'name email profileType');

  res.json({ success: true, count: requests.length, data: requests });
});

// @route   PUT /api/trust-circle/requests/:id
// @desc    Accept or decline a request
const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ success: false, message: "Action must be 'accept' or 'decline'" });
  }

  const request = await TrustCircle.findOne({
    _id: req.params.id,
    recipient: req.user._id,
    status: 'pending'
  });

  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  request.status = action === 'accept' ? 'accepted' : 'declined';
  request.respondedAt = new Date();
  await request.save();

  await request.populate('requester', 'name email profileType');

  res.json({
    success: true,
    message: action === 'accept' ? 'Added to your circle!' : 'Request declined',
    data: request
  });
});

// @route   DELETE /api/trust-circle/:connectionId
// @desc    Remove someone from circle
const removeMember = asyncHandler(async (req, res) => {
  const connection = await TrustCircle.findOneAndDelete({
    _id: req.params.connectionId,
    $or: [{ requester: req.user._id }, { recipient: req.user._id }]
  });

  if (!connection) {
    return res.status(404).json({ success: false, message: 'Connection not found' });
  }

  res.json({ success: true, message: 'Removed from your circle' });
});

// @route   GET /api/trust-circle/search?q=email
// @desc    Search users to add
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 3) {
    return res.status(400).json({ success: false, message: 'Search query must be at least 3 characters' });
  }

  const users = await User.find({
    $or: [
      { email: { $regex: q, $options: 'i' } },
      { name:  { $regex: q, $options: 'i' } }
    ],
    _id: { $ne: req.user._id },
    isActive: true
  })
    .select('name email profileType')
    .limit(8);

  // Check which ones already have a connection
  const existingConnections = await TrustCircle.find({
    $or: [
      { requester: req.user._id, recipient: { $in: users.map(u => u._id) } },
      { recipient: req.user._id, requester: { $in: users.map(u => u._id) } }
    ]
  });

  const connMap = {};
  existingConnections.forEach(c => {
    const otherId = c.requester.toString() === req.user._id.toString()
      ? c.recipient.toString()
      : c.requester.toString();
    connMap[otherId] = c.status;
  });

  const results = users.map(u => ({
    ...u.toObject(),
    connectionStatus: connMap[u._id.toString()] || null
  }));

  res.json({ success: true, data: results });
});

module.exports = {
  getMyCircle,
  sendInvite,
  getPendingRequests,
  respondToRequest,
  removeMember,
  searchUsers
};
