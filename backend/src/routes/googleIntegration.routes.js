const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getAuthUrl,
  oauthCallback,
  fetchMessages,
  disconnect
} = require('../controllers/googleIntegration.controller');

router.get('/url', protect, getAuthUrl);
router.get('/callback', oauthCallback);
router.post('/fetch', protect, fetchMessages);
router.post('/disconnect', protect, disconnect);

module.exports = router;
