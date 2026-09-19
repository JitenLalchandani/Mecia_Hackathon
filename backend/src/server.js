const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const investigationRoutes = require('./routes/investigation.routes');
const profileRoutes = require('./routes/profile.routes');
const reportRoutes = require('./routes/report.routes');
const trustCircleRoutes = require('./routes/trustCircle.routes');
const networkScanRoutes = require('./routes/networkScan.routes');
const publicScanRoutes = require('./routes/publicScan.routes');
const googleIntegrationRoutes = require('./routes/googleIntegration.routes');
const auditRoutes = require('./routes/audit.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { auditLogger } = require('./middleware/audit.middleware');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Audit logger (records authenticated user actions into tamper-evident logs)
app.use(auditLogger());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CyberTwin API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/investigate', investigationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trust-circle', trustCircleRoutes);
app.use('/api/network-scan/domains', networkScanRoutes);
app.use('/api/public', publicScanRoutes);
app.use('/api/integrations/google', googleIntegrationRoutes);
app.use('/api/audit', auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🛡️  CyberTwin API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
