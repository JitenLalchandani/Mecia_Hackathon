const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');
const { getLogs } = require('../controllers/audit.controller');

// GET /api/audit/  - admin only
router.get('/', protect, authorize(['admin']), getLogs);

module.exports = router;
