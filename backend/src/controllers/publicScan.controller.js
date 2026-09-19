const { asyncHandler } = require('../middleware/error.middleware');
const { analyzeMessage } = require('../../../ai/engines/scamDNA');

// @route POST /api/public/scan
// @access Public (prototype)
const publicScan = asyncHandler(async (req, res) => {
  const { text, inputType = 'message', profileType = 'professional' } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Please provide text of at least 10 characters to analyse' });
  }

  const analysis = await analyzeMessage(text.trim(), inputType, profileType);

  res.json({ success: true, data: analysis });
});

module.exports = { publicScan };
