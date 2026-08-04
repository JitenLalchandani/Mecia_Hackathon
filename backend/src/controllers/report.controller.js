const Report = require('../models/Report.model');
const Investigation = require('../models/Investigation.model');
const TrustCircle = require('../models/TrustCircle.model');
const { asyncHandler } = require('../middleware/error.middleware');

// @route   POST /api/reports
// @desc    Save an investigation as a report
const createReport = asyncHandler(async (req, res) => {
  const { investigationId, title, summary, tags, isPublic } = req.body;

  // Make sure investigation belongs to this user
  const investigation = await Investigation.findOne({
    _id: investigationId,
    userId: req.user._id
  });
  if (!investigation) {
    return res.status(404).json({ success: false, message: 'Investigation not found' });
  }

  // Prevent duplicate reports for same investigation
  const existing = await Report.findOne({ investigationId, userId: req.user._id });
  if (existing) {
    return res.status(409).json({ success: false, message: 'You already saved this investigation as a report', data: existing });
  }

  const report = await Report.create({
    userId: req.user._id,
    investigationId,
    title: title || `Investigation – ${new Date().toLocaleDateString()}`,
    summary,
    tags: tags || [],
    isPublic: isPublic || false
  });

  await report.populate('investigationId');

  res.status(201).json({ success: true, message: 'Report saved', data: report });
});

// @route   GET /api/reports
// @desc    Get current user's saved reports
const getMyReports = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;

  const reports = await Report.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('investigationId', 'trustScore scamDNA recommendation createdAt');

  const total = await Report.countDocuments({ userId: req.user._id });

  res.json({ success: true, data: reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @route   GET /api/reports/shared
// @desc    Get reports shared with me by my circle
const getSharedWithMe = asyncHandler(async (req, res) => {
  // Find my circle members
  const connections = await TrustCircle.find({
    $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    status: 'accepted'
  });

  const circleIds = connections.map(c =>
    c.requester.toString() === req.user._id.toString() ? c.recipient : c.requester
  );

  const reports = await Report.find({
    $or: [
      { sharedWith: req.user._id },
      { userId: { $in: circleIds }, isPublic: true }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('userId', 'name profileType')
    .populate('investigationId', 'trustScore scamDNA recommendation createdAt');

  res.json({ success: true, count: reports.length, data: reports });
});

// @route   GET /api/reports/public/:shareToken
// @desc    View a public report by share token (no auth needed)
const getPublicReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ shareToken: req.params.shareToken, isPublic: true })
    .populate('userId', 'name profileType')
    .populate('investigationId');

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found or no longer public' });
  }

  // Increment view count
  await Report.findByIdAndUpdate(report._id, { $inc: { viewCount: 1 } });

  res.json({ success: true, data: report });
});

// @route   GET /api/reports/:id
// @desc    Get single report (owner only)
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('investigationId')
    .populate('sharedWith', 'name email');

  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  res.json({ success: true, data: report });
});

// @route   PUT /api/reports/:id
// @desc    Update report (title, tags, visibility, share with circle)
const updateReport = asyncHandler(async (req, res) => {
  const { title, summary, tags, isPublic, shareWithUserIds } = req.body;

  const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  if (title   !== undefined) report.title   = title;
  if (summary !== undefined) report.summary = summary;
  if (tags    !== undefined) report.tags    = tags;
  if (isPublic !== undefined) report.isPublic = isPublic;

  // Share with specific circle members
  if (shareWithUserIds?.length) {
    // Validate they are in the circle
    const connections = await TrustCircle.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted'
    });
    const circleIds = new Set(connections.map(c =>
      c.requester.toString() === req.user._id.toString()
        ? c.recipient.toString()
        : c.requester.toString()
    ));

    const validIds = shareWithUserIds.filter(id => circleIds.has(id));
    report.sharedWith = [...new Set([...report.sharedWith.map(String), ...validIds])];
  }

  await report.save();
  await report.populate('investigationId');

  res.json({ success: true, message: 'Report updated', data: report });
});

// @route   DELETE /api/reports/:id
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, message: 'Report deleted' });
});

module.exports = { createReport, getMyReports, getSharedWithMe, getPublicReport, getReport, updateReport, deleteReport };
