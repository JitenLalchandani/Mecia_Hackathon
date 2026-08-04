const express = require('express');
const router = express.Router();
const {
  createReport,
  getMyReports,
  getSharedWithMe,
  getPublicReport,
  getReport,
  updateReport,
  deleteReport
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

// Public (no auth) - shared report by token
router.get('/public/:shareToken', getPublicReport);

// Protected
router.use(protect);
router.post('/',            createReport);
router.get('/',             getMyReports);
router.get('/shared',       getSharedWithMe);
router.get('/:id',          getReport);
router.put('/:id',          updateReport);
router.delete('/:id',       deleteReport);

module.exports = router;
