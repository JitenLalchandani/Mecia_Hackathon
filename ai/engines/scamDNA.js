/**
 * CyberTwin Scam DNA Engine
 * Analyses text for scam patterns and produces a Trust Score + Recommendation
 * 
 * ✅ FULLY ADAPTIVE — explanation, advice, and steps change based on profileType:
 *    senior | student | professional | teen
 */

// ── Pattern library ───────────────────────────────────────────────────────────
const SCAM_PATTERNS = {
  urgency: {
    patterns: [
      /act now/i, /urgent/i, /immediately/i, /expires? (today|soon|in \d+)/i,
      /limited time/i, /don't (wait|delay|miss)/i, /within \d+ hours?/i,
      /last chance/i, /deadline/i, /respond immediately/i
    ],
    severity: 'high', weight: 15
  },
  financial_lure: {
    patterns: [
      /you (have won|won|are selected)/i, /claim your (prize|reward|money)/i,
      /\$[\d,]+\s*(million|thousand|prize|reward)/i, /free money/i,
      /lottery/i, /inheritance/i, /unclaimed funds/i, /wire transfer/i,
      /bitcoin/i, /cryptocurrency/i, /investment opportunity/i, /guaranteed returns?/i
    ],
    severity: 'critical', weight: 25
  },
  impersonation: {
    patterns: [
      /i am (from|calling from|with) (google|microsoft|apple|amazon|bank|irs|fbi|police)/i,
      /official (notice|communication|alert)/i,
      /your account (has been|will be) (suspended|blocked|hacked)/i,
      /verify your (account|identity|information)/i,
      /security (alert|breach|warning)/i, /tech support/i, /customer service.*call/i
    ],
    severity: 'high', weight: 20
  },
  personal_info_request: {
    patterns: [
      /send (your )?(password|ssn|social security|credit card|bank account|otp|pin)/i,
      /share (your )?(personal|private|confidential)/i,
      /click (here|this link) to verify/i,
      /update your (payment|billing|account) (info|information|details)/i,
      /confirm your (details|information|account)/i
    ],
    severity: 'critical', weight: 30
  },
  threat: {
    patterns: [
      /your (account|computer|device) (will be|has been|is being) (hacked|compromised|suspended|deleted)/i,
      /legal action/i, /arrest (warrant|you)/i, /you (owe|must pay)/i,
      /virus (detected|found)/i, /your computer is infected/i, /fines?/i, /penalty/i
    ],
    severity: 'high', weight: 20
  },
  link: {
    patterns: [
      /http[s]?:\/\/(?!(?:www\.)?(google|microsoft|apple|amazon|gov)\.[a-z]{2,3})[^\s]+/i,
      /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly/i,
      /click (here|below|this)/i, /visit.*link/i
    ],
    severity: 'medium', weight: 10
  }
};

const SCAM_TYPE_MAP = {
  financial_lure:       'lottery_scam',
  impersonation:        'impersonation',
  personal_info_request:'phishing',
  threat:               'tech_support',
  urgency:              'unknown',
  link:                 'phishing'
};

// ── Adaptive language per profile type ───────────────────────────────────────
/**
 * Each profile gets its own:
 * - explanation   : what was found, tailored to their vocabulary
 * - advice        : what this means in their world
 * - steps         : actionable steps written for their age/context
 */
const ADAPTIVE_CONTENT = {

  senior: {
    explanation: {
      safe:           'Good news — this message looks safe. We did not find any warning signs.',
      suspicious:     'This message has some things that worry us. Please do not rush into anything — take your time and check carefully.',
      likely_scam:    'This looks like it could be a scam. Scammers often pretend to be from banks, the government, or big companies. Please do not reply.',
      confirmed_scam: 'This is a scam. Scammers send messages like this to steal money or personal details. Please do not respond or click anything.'
    },
    advice: {
      safe_to_proceed:       'This message appears safe. You can respond if you wish, but always be careful sharing personal details.',
      proceed_with_caution:  'Before doing anything, please call the organisation directly using the phone number on their official website — not the number in this message.',
      do_not_respond:        'Please do not reply to this message. Do not call any number it mentions. Show it to a family member or trusted friend first.',
      block_and_report:      'Please stop — do not send any money or share your bank details. This is a scam. Ask a family member to help you report and block this person.'
    },
    steps: {
      safe_to_proceed:      ['You can proceed, but never share your PIN, password, or OTP with anyone', 'If unsure, ask a trusted family member to have a look'],
      proceed_with_caution: ['Do not click any links in the message', 'Find the official phone number on the back of your card or their website', 'Call them directly to verify', 'Ask a family member or friend for a second opinion'],
      do_not_respond:       ['Put your phone or computer down for a moment', 'Do not reply, call back, or click any links', 'Show this message to a family member or trusted friend', 'Block the sender so they cannot contact you again', 'If you already shared details, call your bank immediately on the number on your card'],
      block_and_report:     ['Do not send any money — no matter what they say', 'Block this person immediately', 'Ask a family member to help you report this to the police or your bank', 'If you already sent money, call your bank right away', 'Remember: your bank will NEVER ask for your full PIN or password']
    }
  },

  student: {
    explanation: {
      safe:           'Looks clean — no scam patterns detected. Seems legit.',
      suspicious:     'This message is giving off some sus vibes. It has a few patterns we see in scams. Worth double-checking before you do anything.',
      likely_scam:    'Red flags detected 🚩 This has multiple signs of a scam — urgency, sketchy offers, or requests for personal info. Do not engage.',
      confirmed_scam: 'This is 100% a scam. Classic tactics detected. Block and move on — do not give them anything.'
    },
    advice: {
      safe_to_proceed:      'Seems fine! No major red flags. Just the usual reminder — never share passwords or OTPs.',
      proceed_with_caution: 'Hold up before you respond. Verify through the official app or website first, not through any link in this message.',
      do_not_respond:       'Do not reply. Do not click any links. This is very likely a scam targeting students — fake job offers, scholarship scams, and phishing are super common.',
      block_and_report:     'Block them now. Report it to your college IT/security team or the platform you got this on. If you shared anything, act fast.'
    },
    steps: {
      safe_to_proceed:      ['Good to go, but keep your guard up', 'Never share your OTP or password even if they say it\'s urgent'],
      proceed_with_caution: ['Don\'t click any links yet', 'Go directly to the official website or app to verify', 'Google the sender\'s name + "scam" to see if others have reported it', 'Talk to a friend or your college IT team if unsure'],
      do_not_respond:       ['Do not reply or click anything', 'Screenshot it in case you need to report it later', 'Block the sender', 'Report it to your email provider or the platform', 'If you shared banking info, call your bank immediately'],
      block_and_report:     ['Block immediately', 'Report to the platform (Instagram, WhatsApp, email spam etc.)', 'Report to your college cyber cell or local cybercrime portal', 'If money was involved, contact your bank and file a complaint', 'Warn your friends — scammers often target multiple people at once']
    }
  },

  professional: {
    explanation: {
      safe:           'No significant threat indicators detected. Message appears benign.',
      suspicious:     'Anomaly detected — message contains indicators consistent with social engineering. Treat with caution pending verification.',
      likely_scam:    'High threat probability. Multiple TTPs identified: detected patterns align with known phishing/fraud campaigns. Do not interact.',
      confirmed_scam: 'Confirmed threat. Indicators match known scam signatures. Recommend immediate blocking and incident logging.'
    },
    advice: {
      safe_to_proceed:      'No indicators of compromise. Safe to proceed with standard operational caution.',
      proceed_with_caution: 'Verify sender identity through an out-of-band channel. Do not act on embedded links or contact details until verified.',
      do_not_respond:       'Do not engage. Preserve the message as evidence. Initiate your standard phishing response procedure.',
      block_and_report:     'Isolate and report. Block sender, preserve headers/metadata, and escalate through your incident response workflow.'
    },
    steps: {
      safe_to_proceed:      ['Proceed with standard caution', 'Log communication if policy requires', 'Verify domain SPF/DKIM records if email-based'],
      proceed_with_caution: ['Do not click embedded links — navigate directly to the service', 'Verify sender domain for typosquatting (e.g. arnazon.com vs amazon.com)', 'Confirm via secondary channel (phone/official portal)', 'Check email headers for spoofing indicators'],
      do_not_respond:       ['Do not reply or call back numbers provided', 'Preserve original message with full headers', 'Report to IT security / SOC team', 'Block at sender and domain level', 'If credentials were entered, initiate password reset and review auth logs'],
      block_and_report:     ['Block sender at mail gateway or device level', 'Submit to threat intelligence feed / CERT', 'File report with cybercrime authority (cybercrime.gov.in / Action Fraud / IC3)', 'If financial loss occurred, contact bank fraud team immediately', 'Document IOCs for future detection rules']
    }
  },

  teen: {
    explanation: {
      safe:           'It\'s giving legit ✓ — no scam vibes detected.',
      suspicious:     'Something feels off about this 👀 It has a few sketchy patterns. Don\'t do anything without checking first.',
      likely_scam:    'Major red flag energy 🚩🚩 Multiple scam signs found. This person is probably trying to trick you.',
      confirmed_scam: 'It\'s a scam, no cap. Classic tricks detected. Block them NOW and don\'t look back.'
    },
    advice: {
      safe_to_proceed:      'Seems fine! Just remember — no one legit will ever ask for your password or OTP, no matter who they say they are.',
      proceed_with_caution: 'Wait before you reply. If someone online is pushing you to act fast or keep something secret — that\'s a major red flag.',
      do_not_respond:       'Don\'t reply. Don\'t click anything. This has serious scam energy — free money, fake jobs, and "special offers" are almost always traps.',
      block_and_report:     'Block them immediately and tell a trusted adult. If they asked for money or personal info, let someone know now. You\'re not in trouble — they are.'
    },
    steps: {
      safe_to_proceed:      ['All good! Just don\'t share your passwords or location', 'If someone online asks for gifts or money, that\'s always a red flag'],
      proceed_with_caution: ['Don\'t reply yet', 'Screenshot it and show a trusted adult, friend, or school counsellor', 'Never click links from people you don\'t fully trust', 'If it feels wrong, it probably is — trust your gut'],
      do_not_respond:       ['Don\'t reply, don\'t click — nothing', 'Screenshot and show a trusted adult', 'Block the account on every platform they\'re on', 'Report it to the app or platform', 'Remember: getting scammed is not your fault, but you need to tell someone'],
      block_and_report:     ['Block them right now on all platforms', 'Screenshot everything first', 'Tell a parent, older sibling, or trusted adult immediately', 'Report to the app (Instagram, Snapchat, WhatsApp have reporting tools)', 'If they have any of your info or you sent money, an adult needs to know today']
    }
  }
};

// ── Core rule-based analysis ──────────────────────────────────────────────────
const analyzeWithRules = (text, profileType = 'professional') => {
  const evidence = [];
  const redFlags = [];
  const matchedCategories = {};
  let totalWeight = 0;

  for (const [category, config] of Object.entries(SCAM_PATTERNS)) {
    for (const pattern of config.patterns) {
      const match = text.match(pattern);
      if (match) {
        if (!matchedCategories[category]) {
          matchedCategories[category] = { count: 0, snippets: [], weight: config.weight, severity: config.severity };
        }
        matchedCategories[category].count++;
        matchedCategories[category].snippets.push(match[0]);
        evidence.push({ type: category, description: `Detected ${category.replace('_', ' ')} pattern`, severity: config.severity, snippet: match[0] });
        redFlags.push(`${category.replace('_', ' ')}: "${match[0]}"`);
        totalWeight += config.weight;
        break;
      }
    }
  }

  const dominantCategory = Object.entries(matchedCategories).sort((a, b) => b[1].weight - a[1].weight)[0];
  const scamType = dominantCategory ? SCAM_TYPE_MAP[dominantCategory[0]] || 'unknown' : 'legitimate';

  const rawScore  = Math.min(totalWeight, 100);
  const trustScore = Math.max(0, 100 - rawScore);

  let label;
  if      (trustScore >= 75) label = 'safe';
  else if (trustScore >= 50) label = 'suspicious';
  else if (trustScore >= 25) label = 'likely_scam';
  else                       label = 'confirmed_scam';

  let action;
  if      (label === 'safe')           action = 'safe_to_proceed';
  else if (label === 'suspicious')     action = 'proceed_with_caution';
  else if (label === 'likely_scam')    action = 'do_not_respond';
  else                                 action = 'block_and_report';

  // ✅ Pull adaptive content for this profile type
  const profile = ADAPTIVE_CONTENT[profileType] || ADAPTIVE_CONTENT.professional;

  return {
    scamDNA: {
      scamType,
      confidence: Math.min(95, rawScore + 20),
      patterns: Object.keys(matchedCategories),
      evidence: evidence.slice(0, 5),
      redFlags: redFlags.slice(0, 5)
    },
    trustScore: {
      score: trustScore,
      label,
      explanation: profile.explanation[label]
    },
    recommendation: {
      action,
      advice: profile.advice[action],
      steps:  profile.steps[action]
    }
  };
};

// ── Main entry point ──────────────────────────────────────────────────────────
const analyzeMessage = async (text, inputType = 'message', profileType = 'professional') => {
  const startTime = Date.now();

  try {
    if (process.env.OPENAI_API_KEY) {
      return await analyzeWithLLM(text, inputType, profileType, startTime);
    }
  } catch (error) {
    console.warn('LLM analysis failed, falling back to rule-based:', error.message);
  }

  const result = analyzeWithRules(text, profileType);
  return { ...result, processingTime: Date.now() - startTime, aiModel: 'rule-based' };
};

// ── LLM-enhanced analysis ─────────────────────────────────────────────────────
const PROFILE_LLM_INSTRUCTIONS = {
  senior: `The user is a senior citizen (65+). Use very simple, warm, reassuring language. 
Avoid technical jargon completely. Use short sentences. 
For explanations: be gentle and clear, like talking to a grandparent.
For steps: very specific and simple — "Call your bank on the number on the back of your card", not "contact your financial institution".`,

  student: `The user is a university/college student. Use casual, direct language. 
You can use mild internet slang (sus, red flag, legit). Keep it punchy and relatable.
For steps: practical and fast — they're busy. Reference common student scam types (fake job offers, scholarship fraud, OTP phishing).`,

  professional: `The user is a cybersecurity-aware professional. Use precise technical language.
Reference TTPs, IOCs, phishing indicators, social engineering tactics where relevant.
For steps: include technical actions like checking email headers, domain verification, out-of-band verification, incident logging.`,

  teen: `The user is a teenager (13-17). Use friendly, casual language they relate to — energetic, direct, no-nonsense.
You can use phrases like "no cap", "it's giving", "major red flag energy". Keep it short and punchy.
For steps: very concrete and actionable. Emphasise telling a trusted adult. Be supportive, not scary.`
};

const analyzeWithLLM = async (text, inputType, profileType, startTime) => {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const profileInstruction = PROFILE_LLM_INSTRUCTIONS[profileType] || PROFILE_LLM_INSTRUCTIONS.professional;

  const systemPrompt = `You are CyberTwin's Scam DNA engine. Analyse the given text and return ONLY valid JSON.

CRITICAL — LANGUAGE STYLE:
${profileInstruction}

Return ONLY this JSON structure (no markdown, no explanation outside JSON):
{
  "scamDNA": {
    "scamType": "phishing|romance_scam|lottery_scam|tech_support|investment_fraud|impersonation|job_scam|unknown|legitimate",
    "confidence": 0-100,
    "patterns": ["pattern names detected"],
    "evidence": [{"type": "urgency|impersonation|financial_lure|link|personal_info_request|threat|prize|other", "description": "short description", "severity": "low|medium|high|critical", "snippet": "exact text from message"}],
    "redFlags": ["short red flag descriptions"]
  },
  "trustScore": {
    "score": 0-100,
    "label": "safe|suspicious|likely_scam|confirmed_scam",
    "explanation": "1-2 sentences in the correct tone for this user's profile"
  },
  "recommendation": {
    "action": "safe_to_proceed|proceed_with_caution|do_not_respond|block_and_report",
    "advice": "1-2 sentence advice in the correct tone for this user's profile",
    "steps": ["3-5 concrete actionable steps written for this user's profile"]
  }
}

Trust score: 75-100 = safe, 50-74 = suspicious, 25-49 = likely scam, 0-24 = confirmed scam.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyse this ${inputType} for a ${profileType} user:\n\n${text}` }
    ],
    temperature: 0.2,
    max_tokens: 900
  });

  const rawContent = response.choices[0].message.content.trim();
  const jsonMatch  = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid JSON from LLM');

  const result = JSON.parse(jsonMatch[0]);
  return { ...result, processingTime: Date.now() - startTime, aiModel: 'gpt-4o-mini' };
};

module.exports = { analyzeMessage, analyzeWithRules };
