const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, profileType, age } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password, profileType, age });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileType: user.profileType
    }
  });
});

// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileType: user.profileType,
      investigationCount: user.investigationCount
    }
  });
});

// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, getMe };
