const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  // Adaptive UI profile type
  profileType: {
    type: String,
    enum: ['senior', 'student', 'professional', 'teen'],
    default: 'professional'
  },
  age: {
    type: Number,
    min: 10,
    max: 120
  },
  trustCircle: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  investigationCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
  ,
  // Roles for RBAC
  roles: {
    type: [String],
    enum: ['admin', 'editor', 'operator', 'viewer'],
    default: ['viewer']
  },
  google: {
    // encrypted refresh token
    refreshToken: { type: String },
    // scopes granted
    scopes: { type: [String], default: [] },
    // last time tokens were refreshed
    tokenUpdatedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
