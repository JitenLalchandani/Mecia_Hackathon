const User = require('../models/User.model');
const Investigation = require('../models/Investigation.model');
const { asyncHandler } = require('../middleware/error.middleware');

// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('trustCircle', 'name email profileType');

  // Get investigation stats
  const stats = await Investigation.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: '$trustScore.label',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsMap = { safe: 0, suspicious: 0, likely_scam: 0, confirmed_scam: 0 };
  stats.forEach(s => { statsMap[s._id] = s.count; });

  res.json({
    success: true,
    data: {
      user,
      stats: {
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        ...statsMap
      }
    }
  });
});

// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, profileType, age, preferredLanguage, techLevel, accessibilityPreferences, isOnboarded } = req.body;
  const allowedFields = {};
  
  if (name) allowedFields.name = name;
  if (profileType) allowedFields.profileType = profileType;
  if (age) allowedFields.age = age;
  if (preferredLanguage) allowedFields.preferredLanguage = preferredLanguage;
  if (techLevel) allowedFields.techLevel = techLevel;
  if (accessibilityPreferences) allowedFields.accessibilityPreferences = accessibilityPreferences;
  if (typeof isOnboarded === 'boolean') allowedFields.isOnboarded = isOnboarded;

  const user = await User.findByIdAndUpdate(req.user._id, allowedFields, {
    new: true,
    runValidators: true
  });

  res.json({ success: true, message: 'Profile updated', data: user });
});

// @route   PUT /api/profile/onboarding
// @access  Private
const completeOnboarding = asyncHandler(async (req, res) => {
  const { profileType, preferredLanguage, techLevel, accessibilityPreferences, age } = req.body;

  const updateData = {
    profileType: profileType || 'Student',
    preferredLanguage: preferredLanguage || 'English',
    techLevel: techLevel || 'Beginner',
    accessibilityPreferences: accessibilityPreferences || {},
    isOnboarded: true
  };

  if (age) updateData.age = age;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    message: 'Onboarding completed successfully',
    data: user
  });
});

module.exports = { getProfile, updateProfile, completeOnboarding };