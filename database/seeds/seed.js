/**
 * CyberTwin AI — Database Seed
 * Run: node seed.js  (from inside database/seeds/)
 * Creates 4 demo users (one per profile type) + sample investigations
 * Each investigation uses adaptive language for that user's profile type
 */

require('dotenv').config({ path: '../../backend/.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybertwin';

// ── Mini schemas (standalone — no circular deps) ──────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, email: String, password: String,
  profileType: String, age: Number,
  investigationCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const investigationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  inputText: String, inputType: String,
  scamDNA: Object, trustScore: Object, recommendation: Object,
  processingTime: Number, aiModel: String
}, { timestamps: true });

const User          = mongoose.models.User          || mongoose.model('User',          userSchema);
const Investigation = mongoose.models.Investigation || mongoose.model('Investigation', investigationSchema);

// ── Demo users ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { name: 'Margaret Patel',  email: 'senior@demo.com',  password: 'demo1234', profileType: 'senior',       age: 68 },
  { name: 'Rohan Mehta',     email: 'student@demo.com', password: 'demo1234', profileType: 'student',      age: 20 },
  { name: 'Priya Sharma',    email: 'pro@demo.com',     password: 'demo1234', profileType: 'professional', age: 34 },
  { name: 'Zara Khan',       email: 'teen@demo.com',    password: 'demo1234', profileType: 'teen',         age: 16 },
];

// ── Sample investigations — same scam message, 4 different AI responses ───────
const SCAM_TEXT = 'URGENT: Your SBI account has been temporarily suspended. Click here immediately to verify: http://sbi-secure-verify.xyz/login';

const SAMPLE_INVESTIGATIONS = {
  senior: {
    inputText:  SCAM_TEXT,
    inputType:  'message',
    scamDNA: {
      scamType: 'phishing', confidence: 94,
      patterns: ['urgency', 'impersonation', 'link'],
      evidence: [
        { type: 'urgency',        description: 'Detected urgency pattern',        severity: 'high',     snippet: 'URGENT' },
        { type: 'impersonation',  description: 'Detected impersonation pattern',  severity: 'high',     snippet: 'SBI account' },
        { type: 'link',           description: 'Detected suspicious link',        severity: 'medium',   snippet: 'http://sbi-secure-verify.xyz/login' }
      ],
      redFlags: ['urgency: "URGENT"', 'impersonation: "SBI account"', 'link: suspicious URL']
    },
    trustScore: {
      score: 6, label: 'confirmed_scam',
      explanation: 'This is a scam. Scammers send messages like this to steal money or personal details. Please do not respond or click anything.'
    },
    recommendation: {
      action: 'block_and_report',
      advice: 'Please stop — do not send any money or share your bank details. This is a scam. Ask a family member to help you report and block this person.',
      steps: [
        'Do not send any money — no matter what they say',
        'Block this person immediately',
        'Ask a family member to help you report this to the police or your bank',
        'If you already sent money, call your bank right away',
        'Remember: your bank will NEVER ask for your full PIN or password'
      ]
    },
    processingTime: 312, aiModel: 'rule-based'
  },

  student: {
    inputText:  SCAM_TEXT,
    inputType:  'message',
    scamDNA: {
      scamType: 'phishing', confidence: 94,
      patterns: ['urgency', 'impersonation', 'link'],
      evidence: [
        { type: 'urgency',       description: 'Urgency injection detected',      severity: 'high',   snippet: 'URGENT' },
        { type: 'impersonation', description: 'Impersonating banking service',   severity: 'high',   snippet: 'SBI account' },
        { type: 'link',          description: 'Suspicious external link',        severity: 'medium', snippet: 'http://sbi-secure-verify.xyz/login' }
      ],
      redFlags: ['urgency: "URGENT"', 'impersonation: "SBI account"', 'link: suspicious URL']
    },
    trustScore: {
      score: 6, label: 'confirmed_scam',
      explanation: 'This is 100% a scam. Classic tactics detected — urgency + fake bank impersonation + dodgy link. Block and move on.'
    },
    recommendation: {
      action: 'block_and_report',
      advice: 'Block them now. Report it to your college IT/security team or the platform you got this on. If you shared anything, act fast.',
      steps: [
        'Block immediately',
        'Report to the platform (email spam button, WhatsApp report etc.)',
        'Report to your college cyber cell or cybercrime.gov.in',
        'If banking info was shared, call your bank immediately',
        'Warn your friends — scammers often target multiple people at once'
      ]
    },
    processingTime: 298, aiModel: 'rule-based'
  },

  professional: {
    inputText:  SCAM_TEXT,
    inputType:  'message',
    scamDNA: {
      scamType: 'phishing', confidence: 94,
      patterns: ['urgency', 'impersonation', 'link'],
      evidence: [
        { type: 'urgency',       description: 'Urgency injection TTP detected',          severity: 'high',   snippet: 'URGENT' },
        { type: 'impersonation', description: 'Financial institution brand impersonation',severity: 'high',   snippet: 'SBI account' },
        { type: 'link',          description: 'Credential harvesting URI detected',       severity: 'medium', snippet: 'http://sbi-secure-verify.xyz/login' }
      ],
      redFlags: ['urgency: "URGENT"', 'impersonation: "SBI account"', 'credential harvesting URI: sbi-secure-verify.xyz']
    },
    trustScore: {
      score: 6, label: 'confirmed_scam',
      explanation: 'Confirmed threat. Indicators match known phishing signatures: urgency injection + brand impersonation + credential harvesting URI on non-SBI domain.'
    },
    recommendation: {
      action: 'block_and_report',
      advice: 'Isolate and report. Block sender, preserve headers/metadata, and escalate through your incident response workflow.',
      steps: [
        'Block sender at mail gateway or device level',
        'Verify: sbi-secure-verify.xyz is NOT an SBI-owned domain',
        'Submit IOCs to threat intelligence feed / CERT-In',
        'File report with cybercrime.gov.in or IC3',
        'Document: sender address, timestamp, full headers for evidence log'
      ]
    },
    processingTime: 289, aiModel: 'rule-based'
  },

  teen: {
    inputText:  SCAM_TEXT,
    inputType:  'message',
    scamDNA: {
      scamType: 'phishing', confidence: 94,
      patterns: ['urgency', 'impersonation', 'link'],
      evidence: [
        { type: 'urgency',       description: 'Urgency pressure tactic', severity: 'high',   snippet: 'URGENT' },
        { type: 'impersonation', description: 'Fake bank message',        severity: 'high',   snippet: 'SBI account' },
        { type: 'link',          description: 'Sketchy link detected',    severity: 'medium', snippet: 'http://sbi-secure-verify.xyz/login' }
      ],
      redFlags: ['urgency: "URGENT"', 'fake bank impersonation', 'sketchy link']
    },
    trustScore: {
      score: 6, label: 'confirmed_scam',
      explanation: 'It\'s a scam, no cap. Fake bank message with a sketchy link — classic trap. Block them NOW.'
    },
    recommendation: {
      action: 'block_and_report',
      advice: 'Block them immediately and tell a trusted adult. If they asked for money or personal info, let someone know now. You\'re not in trouble — they are.',
      steps: [
        'Block them right now on all platforms',
        'Screenshot everything first as proof',
        'Tell a parent, older sibling, or trusted adult immediately',
        'Report to the app (most have a "report" button)',
        'If you sent any money or info, an adult needs to know today'
      ]
    },
    processingTime: 301, aiModel: 'rule-based'
  }
};

// ── Run seed ──────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await User.deleteMany({ email: { $in: DEMO_USERS.map(u => u.email) } });
    console.log('🗑️  Cleared existing demo users\n');

    for (const userData of DEMO_USERS) {
      const user = new User(userData);
      await user.save();
      console.log(`👤 Created: ${user.name.padEnd(18)} (${user.email}) — ${user.profileType}`);

      // Create one sample investigation per user with their adaptive response
      const invData = SAMPLE_INVESTIGATIONS[userData.profileType];
      await Investigation.create({ ...invData, userId: user._id });
      await User.findByIdAndUpdate(user._id, { investigationCount: 1 });
      console.log(`   🔍 Added adaptive investigation for ${userData.profileType}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed complete! Demo credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    DEMO_USERS.forEach(u => {
      console.log(`  ${u.profileType.padEnd(14)} ${u.email.padEnd(25)} demo1234`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 PITCH TIP: Login as each user and investigate the same');
    console.log('   suspicious message — you\'ll see 4 completely different');
    console.log('   AI responses tailored to each profile type!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
