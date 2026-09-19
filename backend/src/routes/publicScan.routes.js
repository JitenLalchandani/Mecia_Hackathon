const express = require('express');
const router = express.Router();
const { publicScan } = require('../controllers/publicScan.controller');

router.post('/scan', publicScan);

module.exports = router;
