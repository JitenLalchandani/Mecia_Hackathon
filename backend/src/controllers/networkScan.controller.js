const VerifiedDomain = require('../models/VerifiedDomain.model');
const ScanResult     = require('../models/ScanResult.model');
const { asyncHandler } = require('../middleware/error.middleware');
const { runScan, verifyViaDNS, verifyViaFile } = require('../../../ai/engines/nmapEngine');

// Exact consent text — stored with every domain and scan for audit trail
const CONSENT_TEXT = 'I confirm that I own this domain or have explicit written permission from the domain owner to perform security scanning. I understand that scanning domains without permission is illegal and against CyberTwin\'s terms of service.';

// ── 1. Add a domain (starts verification flow) ────────────────────────────────
// @route  POST /api/network-scan/domains
const addDomain = asyncHandler(async (req, res) => {
  const { domain, verificationMethod = 'dns_txt', consentGiven } = req.body;

  if (!domain) return res.status(400).json({ success: false, message: 'Domain is required' });

  // ✅ GATE 1: Explicit consent required
  if (!consentGiven) {
    return res.status(400).json({
      success: false,
      message: 'You must confirm ownership/permission before adding a domain',
      consentRequired: true,
      consentText: CONSENT_TEXT
    });
  }

  // Clean domain — strip protocol and path
  const cleanDomain = domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();

  // Validate domain format
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(cleanDomain)) {
    return res.status(400).json({ success: false, message: 'Invalid domain format. Use: example.com' });
  }

  // Block private/local ranges
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (blocked.includes(cleanDomain) || cleanDomain.endsWith('.local') || cleanDomain.endsWith('.internal')) {
    return res.status(400).json({ success: false, message: 'Cannot scan local or internal addresses' });
  }

  // Check for existing
  const existing = await VerifiedDomain.findOne({ userId: req.user._id, domain: cleanDomain });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `${cleanDomain} is already in your domains (status: ${existing.status})`,
      data: existing
    });
  }

  const verifiedDomain = await VerifiedDomain.create({
    userId:             req.user._id,
    domain:             cleanDomain,
    verificationMethod,
    consentGiven:       true,
    consentGivenAt:     new Date(),
    consentText:        CONSENT_TEXT
  });

  res.status(201).json({
    success: true,
    message: 'Domain added. Complete verification to enable scanning.',
    data: verifiedDomain,
    verificationInstructions: getVerificationInstructions(verifiedDomain)
  });
});

// ── 2. Get verification instructions ─────────────────────────────────────────
const getVerificationInstructions = (vd) => {
  if (vd.verificationMethod === 'dns_txt') {
    return {
      method:  'DNS TXT Record',
      steps: [
        `Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)`,
        `Go to DNS settings for ${vd.domain}`,
        `Add a new TXT record:`,
        `  Name/Host: _cybertwin-verify`,
        `  Value: ${vd.verificationToken}`,
        `  TTL: 300 (or Auto)`,
        `Click "Save" and wait 1–5 minutes for DNS to propagate`,
        `Come back and click "Verify Now"`
      ],
      record: {
        name:  `_cybertwin-verify.${vd.domain}`,
        type:  'TXT',
        value: vd.verificationToken
      }
    };
  }
  return {
    method: 'File Upload',
    steps: [
      `Create a file at this exact path on your web server:`,
      `  /.well-known/cybertwin-verify.txt`,
      `The file must contain exactly this text:`,
      `  ${vd.verificationToken}`,
      `Make sure the file is publicly accessible at:`,
      `  https://${vd.domain}/.well-known/cybertwin-verify.txt`,
      `Then click "Verify Now"`
    ],
    fileUrl: `https://${vd.domain}/.well-known/cybertwin-verify.txt`,
    fileContent: vd.verificationToken
  };
};

// ── 3. Get all domains for user ───────────────────────────────────────────────
// @route  GET /api/network-scan/domains
const getMyDomains = asyncHandler(async (req, res) => {
  const domains = await VerifiedDomain.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: domains.length, data: domains });
});

// ── 4. Get single domain with instructions ────────────────────────────────────
// @route  GET /api/network-scan/domains/:id
const getDomain = asyncHandler(async (req, res) => {
  const vd = await VerifiedDomain.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vd) return res.status(404).json({ success: false, message: 'Domain not found' });

  res.json({
    success: true,
    data: vd,
    verificationInstructions: vd.status !== 'verified' ? getVerificationInstructions(vd) : null
  });
});

// ── 5. Verify domain ownership ────────────────────────────────────────────────
// @route  POST /api/network-scan/domains/:id/verify
const verifyDomain = asyncHandler(async (req, res) => {
  const vd = await VerifiedDomain.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vd) return res.status(404).json({ success: false, message: 'Domain not found' });

  if (vd.status === 'verified') {
    return res.json({ success: true, message: 'Domain is already verified', data: vd });
  }

  // ✅ GATE 2: Check verification token in DNS or file
  let verified = false;
  if (vd.verificationMethod === 'dns_txt') {
    verified = await verifyViaDNS(vd.domain, vd.verificationToken);
  } else {
    verified = await verifyViaFile(vd.domain, vd.verificationToken);
  }

  if (!verified) {
    vd.status        = 'failed';
    vd.failureReason = vd.verificationMethod === 'dns_txt'
      ? `TXT record not found at _cybertwin-verify.${vd.domain}. Check DNS settings and try again in a few minutes.`
      : `File not accessible at https://${vd.domain}/.well-known/cybertwin-verify.txt`;
    await vd.save();

    return res.status(400).json({
      success: false,
      message: 'Verification failed',
      reason: vd.failureReason,
      data: vd,
      verificationInstructions: getVerificationInstructions(vd)
    });
  }

  vd.status     = 'verified';
  vd.verifiedAt = new Date();
  await vd.save();

  res.json({
    success: true,
    message: `✅ ${vd.domain} verified! You can now run security scans.`,
    data: vd
  });
});

// ── 6. Delete a domain ────────────────────────────────────────────────────────
// @route  DELETE /api/network-scan/domains/:id
const deleteDomain = asyncHandler(async (req, res) => {
  const vd = await VerifiedDomain.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!vd) return res.status(404).json({ success: false, message: 'Domain not found' });
  await ScanResult.deleteMany({ verifiedDomainId: req.params.id });
  res.json({ success: true, message: `${vd.domain} removed along with its scan history` });
});

// ── 7. Start a scan ───────────────────────────────────────────────────────────
// @route  POST /api/network-scan/domains/:id/scan
const startScan = asyncHandler(async (req, res) => {
  const { scanType = 'quick', consentConfirmed } = req.body;

  // ✅ GATE 3: Re-confirm consent at scan time (not just at domain add time)
  if (!consentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'You must confirm ownership/permission before each scan',
      consentRequired: true,
      consentText: CONSENT_TEXT
    });
  }

  const vd = await VerifiedDomain.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vd) return res.status(404).json({ success: false, message: 'Domain not found' });

  // ✅ GATE 2 enforcement: only verified domains can be scanned
  if (vd.status !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Domain not verified. Complete ownership verification before scanning.`,
      verificationInstructions: getVerificationInstructions(vd)
    });
  }

  const validScanTypes = ['quick', 'standard', 'full'];
  if (!validScanTypes.includes(scanType)) {
    return res.status(400).json({ success: false, message: 'Invalid scan type. Use: quick, standard, or full' });
  }

  // Create scan record as "running"
  const scanRecord = await ScanResult.create({
    userId:             req.user._id,
    verifiedDomainId:   vd._id,
    domain:             vd.domain,
    scanType,
    status:             'running',
    consentConfirmedAt: new Date()
  });

  // Update domain's last scan time
  await VerifiedDomain.findByIdAndUpdate(vd._id, { lastScannedAt: new Date() });

  // Run scan asynchronously — respond immediately with scan ID
  const profileType = req.user.profileType || 'professional';

  runScan(vd.domain, scanType, profileType)
    .then(async (result) => {
      await ScanResult.findByIdAndUpdate(scanRecord._id, {
        ...result,
        status: 'completed'
      });
      console.log(`✅ Scan completed for ${vd.domain}`);
    })
    .catch(async (err) => {
      await ScanResult.findByIdAndUpdate(scanRecord._id, {
        status:       'failed',
        errorMessage: err.message
      });
      console.error(`❌ Scan failed for ${vd.domain}: ${err.message}`);
    });

  res.status(202).json({
    success: true,
    message: `Scan started for ${vd.domain}. Poll /api/network-scan/results/${scanRecord._id} for results.`,
    scanId: scanRecord._id,
    estimatedTime: scanType === 'quick' ? '30-60 seconds' : scanType === 'standard' ? '1-3 minutes' : '5-15 minutes'
  });
});

// ── 8. Get scan result (poll) ─────────────────────────────────────────────────
// @route  GET /api/network-scan/results/:scanId
const getScanResult = asyncHandler(async (req, res) => {
  const scan = await ScanResult.findOne({ _id: req.params.scanId, userId: req.user._id });
  if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
  res.json({ success: true, data: scan });
});

// ── 9. Get all scan history for a domain ─────────────────────────────────────
// @route  GET /api/network-scan/domains/:id/history
const getScanHistory = asyncHandler(async (req, res) => {
  const vd = await VerifiedDomain.findOne({ _id: req.params.id, userId: req.user._id });
  if (!vd) return res.status(404).json({ success: false, message: 'Domain not found' });

  const scans = await ScanResult.find({ verifiedDomainId: vd._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('-rawOutput');

  res.json({ success: true, count: scans.length, data: scans });
});

module.exports = {
  addDomain, getMyDomains, getDomain,
  verifyDomain, deleteDomain,
  startScan, getScanResult, getScanHistory
};
