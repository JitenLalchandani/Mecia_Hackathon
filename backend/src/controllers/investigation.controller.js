const Investigation = require('../models/Investigation.model');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');
const { analyzeMessage } = require('../../../ai/engines/scamDNA');

// @route   POST /api/investigate/message
// @access  Private
const investigateMessage = asyncHandler(async (req, res) => {
  const { text, inputType = 'message' } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Please provide text of at least 10 characters to analyse'
    });
  }

  // ✅ Pass profileType from the authenticated user into the AI engine
  const profileType = req.user.profileType || 'professional';
  const analysis = await analyzeMessage(text.trim(), inputType, profileType);

  const investigation = await Investigation.create({
    userId:          req.user._id,
    inputText:       text.trim(),
    inputType,
    scamDNA:         analysis.scamDNA,
    trustScore:      analysis.trustScore,
    recommendation:  analysis.recommendation,
    processingTime:  analysis.processingTime,
    aiModel:         analysis.aiModel
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { investigationCount: 1 } });

  res.status(201).json({
    success: true,
    message: 'Investigation complete',
    data: investigation
  });
});

// @route   GET /api/investigate/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const investigations = await Investigation.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-inputText');

  const total = await Investigation.countDocuments({ userId: req.user._id });

  res.json({
    success: true,
    data: investigations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @route   GET /api/investigate/:id
// @access  Private
const getInvestigation = asyncHandler(async (req, res) => {
  const investigation = await Investigation.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!investigation) {
    return res.status(404).json({ success: false, message: 'Investigation not found' });
  }

  res.json({ success: true, data: investigation });
});

// @route   POST /api/investigate/:id/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { wasHelpful, actualOutcome } = req.body;

  const investigation = await Investigation.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { userFeedback: { wasHelpful, actualOutcome } },
    { new: true }
  );

  if (!investigation) {
    return res.status(404).json({ success: false, message: 'Investigation not found' });
  }

  res.json({ success: true, message: 'Feedback recorded', data: investigation });
});

module.exports = { investigateMessage, getHistory, getInvestigation, submitFeedback };
