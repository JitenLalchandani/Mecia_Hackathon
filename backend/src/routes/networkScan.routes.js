const express = require('express');
const router  = express.Router();
const {
  addDomain, getMyDomains, getDomain,
  verifyDomain, deleteDomain,
  startScan, getScanResult, getScanHistory
} = require('../controllers/networkScan.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// ── Scan result polling — must come BEFORE /:id to avoid conflict ──
router.get('/results/:scanId',   getScanResult);

// ── Domain management ──────────────────────────────────────────────
router.get('/',                  getMyDomains);
router.post('/',                 addDomain);
router.get('/:id',               getDomain);
router.delete('/:id',            deleteDomain);

// ── Verification & scanning ────────────────────────────────────────
router.post('/:id/verify',       verifyDomain);
router.post('/:id/scan',         startScan);
router.get('/:id/history',       getScanHistory);

module.exports = router;
