const { asyncHandler } = require('../middleware/error.middleware');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { encrypt, decrypt } = require('../utils/crypto');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT
  );
}

// GET /api/integrations/google/url
// Protected: returns authorization URL
const getAuthUrl = asyncHandler(async (req, res) => {
  const oAuth2Client = getOAuthClient();
  const state = jwt.sign({ uid: req.user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state
  });
  res.json({ success: true, url });
});

// GET /api/integrations/google/callback
// Public: Google will redirect here with code & state
const oauthCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing code or state');

  let payload;
  try {
    payload = jwt.verify(state, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(400).send('Invalid state');
  }

  const user = await User.findById(payload.uid);
  if (!user) return res.status(404).send('User not found');

  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);

  if (!tokens || !tokens.refresh_token) {
    // If refresh_token missing, user may have previously granted access; try to use access_token
  }

  // Store encrypted refresh token (if present) and scopes
  if (tokens.refresh_token) {
    user.google.refreshToken = encrypt(tokens.refresh_token);
  }
  user.google.scopes = tokens.scope ? tokens.scope.split(' ') : SCOPES;
  user.google.tokenUpdatedAt = new Date();
  await user.save();

  // Redirect back to client (front-end) with success
  const frontend = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${frontend}/integrations?status=connected`);
});

// POST /api/integrations/google/fetch
// Protected: fetch recent messages and return summaries (does not persist content)
const fetchMessages = asyncHandler(async (req, res) => {
  const { max = 10 } = req.body;
  const user = await User.findById(req.user._id);
  if (!user || !user.google || !user.google.refreshToken) {
    return res.status(400).json({ success: false, message: 'Google not connected' });
  }

  const refreshToken = decrypt(user.google.refreshToken);
  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // List messages
  const listResp = await gmail.users.messages.list({ userId: 'me', maxResults: max });
  const ids = (listResp.data.messages || []).map(m => m.id);

  const messages = [];
  for (const id of ids) {
    try {
      const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      const headers = msg.data.payload.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      // extract a plain text snippet safely
      const snippet = msg.data.snippet || '';
      messages.push({ id, subject, from, snippet });
    } catch (e) {
      // skip individual failures
    }
  }

  res.json({ success: true, data: { messages } });
});

// POST /api/integrations/google/disconnect
const disconnect = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.google = undefined;
  await user.save();
  res.json({ success: true, message: 'Google disconnected' });
});

module.exports = { getAuthUrl, oauthCallback, fetchMessages, disconnect };
