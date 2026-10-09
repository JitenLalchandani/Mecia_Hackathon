const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription.model');

// Load VAPID keys from env
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:admin@cybertwin.local', VAPID_PUBLIC, VAPID_PRIVATE);
}

router.get('/vapidPublicKey', (req, res) => {
  if (!VAPID_PUBLIC) return res.status(500).json({ error: 'VAPID key not configured' });
  res.json({ publicKey: VAPID_PUBLIC });
});

router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Missing subscription' });

    // Upsert subscription by endpoint
    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { $set: { keys: subscription.keys || {}, expirationTime: subscription.expirationTime || null } },
      { upsert: true, new: true }
    );

    res.json({ success: true, id: doc._id });
  } catch (e) {
    console.error('Subscribe error', e);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Admin endpoint: send notification to all subscriptions (for testing)
router.post('/send-all', async (req, res) => {
  const { title = 'CyberTwin', body = 'Test notification', url = '/' } = req.body || {};
  try {
    const subs = await PushSubscription.find({});
    const payload = JSON.stringify({ title, body, url });
    const results = [];
    for (const s of subs) {
      try {
        await webpush.sendNotification(s.toObject(), payload);
        results.push({ endpoint: s.endpoint, success: true });
      } catch (err) {
        console.warn('Send failed', s.endpoint, err && err.statusCode);
        results.push({ endpoint: s.endpoint, success: false });
      }
    }
    res.json({ success: true, results });
  } catch (e) {
    console.error('send-all', e);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;
