const express = require('express');
const router = express.Router();
const {
  investigateMessage,
  getHistory,
  getInvestigation,
  submitFeedback
} = require('../controllers/investigation.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // All investigation routes require auth

router.post('/message', investigateMessage);
router.get('/history', getHistory);
router.get('/:id', getInvestigation);
router.post('/:id/feedback', submitFeedback);

module.exports = router;
