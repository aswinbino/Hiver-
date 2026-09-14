import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { sanitizeAndMaskPII } from './preprocessing.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROCESSED_PAIRS_PATH = path.join(PROJECT_ROOT, 'data', 'processed', 'apple_pairs.json');

let apiQuotaExhausted = false;

export const INTENT_CATEGORIES = [
  'Software & Update Issues',
  'Hardware & Battery Malfunction',
  'Account, Apple ID & Security',
  'App Store & In-App Purchases',
  'Connectivity (Wi-Fi, Cellular, Bluetooth)',
  'General Inquiry & How-To'
];

export const DECISION_ENUM = ['AUTO_HANDLE', 'ESCALATE'];

export const SupportActionSchema = z.object({
  intent: z.enum([
    'Software & Update Issues',
    'Hardware & Battery Malfunction',
    'Account, Apple ID & Security',
    'App Store & In-App Purchases',
    'Connectivity (Wi-Fi, Cellular, Bluetooth)',
    'General Inquiry & How-To'
  ]),
  intent_confidence: z.number().min(0.0).max(1.0).describe('Confidence score between 0.0 and 1.0'),
  draft_reply: z.string().describe('Helpful, empathetic response grounded in Apple Support voice and historical resolutions'),
  decision: z.enum(['AUTO_HANDLE', 'ESCALATE']).describe('Final operational decision'),
  escalation_reason: z.string().describe('Specific justification for escalation, or "N/A" if AUTO_HANDLE')
});

let historicalPairsCache = null;

function loadHistoricalPairs() {
  if (historicalPairsCache) return historicalPairsCache;
  try {
    if (fs.existsSync(PROCESSED_PAIRS_PATH)) {
      const data = fs.readFileSync(PROCESSED_PAIRS_PATH, 'utf8');
      historicalPairsCache = JSON.parse(data);
    } else {
      historicalPairsCache = [];
    }
  } catch (err) {
    console.warn('[Router] Could not read processed pairs:', err.message);
    historicalPairsCache = [];
  }
  return historicalPairsCache;
}

export function retrieveRelevantHistoricalContext(query, topK = 3) {
  const pairs = loadHistoricalPairs();
  if (!pairs || pairs.length === 0) return [];

  const queryTokens = new Set(
    query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2)
  );

  const scored = pairs.map((pair) => {
    const targetTokens = (pair.customer_query + ' ' + pair.historical_reply)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/);

    let matchCount = 0;
    for (const token of targetTokens) {
      if (queryTokens.has(token)) {
        matchCount++;
      }
    }
    const score = matchCount / (Math.sqrt(targetTokens.length) + 1);
    return { pair, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0.05).map((s) => s.pair);
}

export function evaluateDeterministicEscalationRules(query, modelResult) {
  const qLower = query.toLowerCase();

  const safetyKeywords = [
    'swelling', 'swollen', 'bulging', 'bulge', 'smoke', 'smoking', 'fire', 'caught fire',
    'spark', 'sparking', 'sparks', 'explosion', 'exploding', 'exploded',
    'scorching', 'burning', 'burns', 'burn', 'overheating to touch', 'shock', 'electric shock'
  ];
  for (const kw of safetyKeywords) {
    if (qLower.includes(kw)) {
      return {
        mustEscalate: true,
        reason: `Physical safety hazard detected: "${kw}". Immediate Senior Safety Engineering escalation required.`
      };
    }
  }

  const physicalOrTheftKeywords = [
    'stolen', 'theft', 'robbed', 'shattered screen', 'screen broke into pieces',
    'run over', 'deep ocean', 'dropped in pool', 'submerged in ocean'
  ];
  for (const kw of physicalOrTheftKeywords) {
    if (qLower.includes(kw)) {
      return {
        mustEscalate: true,
        reason: `Hardware damage or stolen device detected: "${kw}". Requires AppleCare hardware inspection or law enforcement liaison.`
      };
    }
  }

  const authPatterns = [
    /password/i,
    /forgot.*password/i,
    /reset.*password/i,
    /account lockout/i,
    /locked out/i,
    /activation lock/i,
    /hacked/i,
    /compromised/i,
    /two-factor.*lost/i,
    /2fa.*lost/i,
    /unauthorized.*purchase/i,
    /unauthorized.*charge/i,
    /double billed/i,
    /double charged/i,
    /charged three times/i,
    /fraud/i,
    /dispute.*charge/i,
    /refund.*dispute/i,
    /disabled in the app store/i
  ];
  for (const pattern of authPatterns) {
    if (pattern.test(qLower)) {
      return {
        mustEscalate: true,
        reason: `Private authentication or financial dispute detected matching ${pattern}. Requires secure identity verification via private channels.`
      };
    }
  }

  const legalKeywords = [
    'lawsuit', 'sue you', 'sue apple', 'attorney', 'lawyer', 'legal action',
    'better business bureau', 'bbb complaint', 'consumer protection', 'class action',
    'false advertising', 'ftc'
  ];
  for (const kw of legalKeywords) {
    if (qLower.includes(kw)) {
      return {
        mustEscalate: true,
        reason: `Legal threat or regulatory escalation detected: "${kw}". Executive Customer Relations referral required.`
      };
    }
  }

  if (modelResult && typeof modelResult.intent_confidence === 'number' && modelResult.intent_confidence < 0.75) {
    return {
      mustEscalate: true,
      reason: `Model confidence (${modelResult.intent_confidence.toFixed(2)}) is below operational threshold (0.75). Route to human specialist.`
    };
  }

  return { mustEscalate: false, reason: 'N/A' };
}

export function validateAndSanitizeURLs(draftReply) {
  if (!draftReply || typeof draftReply !== 'string') return draftReply;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = draftReply.match(urlRegex);

  if (!matches) return draftReply;

  const allowedDomains = [
    'https://support.apple.com',
    'https://iforgot.apple.com',
    'https://reportaproblem.apple.com',
    'https://appleid.apple.com'
  ];

  let sanitizedReply = draftReply;

  for (const url of matches) {
    const cleanUrl = url.replace(/[.,!?]$/, '');
    const isApproved = allowedDomains.some(domain => cleanUrl.startsWith(domain));

    if (!isApproved) {
      console.warn(`[Guardrail] Blocked hallucinated/unapproved URL: "${cleanUrl}"`);
      sanitizedReply = sanitizedReply.replace(cleanUrl, 'https://support.apple.com');
    }
  }

  return sanitizedReply;
}

function mockSimulateAgentResponse(cleanQuery) {
  const q = cleanQuery.toLowerCase();

  let intent = 'General Inquiry & How-To';
  let confidence = 0.88;
  let draftReply = "Thanks for reaching out to Apple Support! We're here to help. Could you share your device model and OS version so we can assist?";
  let decision = 'AUTO_HANDLE';
  let escalationReason = 'N/A';

  if (q.includes('battery') || q.includes('speaker') || q.includes('microphone') || q.includes('taptic') || q.includes('charging port') || q.includes('magsafe') || q.includes('swelling') || q.includes('bulging') || q.includes('hot') || q.includes('hardware') || q.includes('earpiece') || q.includes('screen') || q.includes('shattered') || q.includes('lens') || q.includes('shock')) {
    intent = 'Hardware & Battery Malfunction';
    confidence = 0.92;
    draftReply = "We want to make sure your hardware is running optimally. Check Settings > Battery > Battery Health, or let us know if you've noticed physical symptoms.";
  } else if (q.includes('ios') || q.includes('update') || q.includes('crash') || q.includes('slow') || q.includes('stuck') || q.includes('freeze') || q.includes('boot loop') || q.includes('storage') || q.includes('safari') || q.includes('widget') || q.includes('restart') || q.includes('airdrop') || q.includes('carplay') || q.includes('dictation') || q.includes('voice memos') || q.includes('panics')) {
    intent = 'Software & Update Issues';
    confidence = 0.90;
    draftReply = "We understand software hiccups can be frustrating. Try restarting your device, ensuring at least 5GB free storage, and checking for updates under Settings > General > Software Update.";
  } else if (q.includes('apple id') || q.includes('password') || q.includes('icloud') || q.includes('locked') || q.includes('security') || q.includes('2fa') || q.includes('recovery contact') || q.includes('passkey') || q.includes('passcode') || q.includes('hacked') || q.includes('two-factor') || q.includes('activation lock') || q.includes('phishing')) {
    intent = 'Account, Apple ID & Security';
    confidence = 0.93;
    draftReply = "Account security is our priority. For your safety, please visit iforgot.apple.com to verify your account credentials securely.";
  } else if (q.includes('app store') || q.includes('purchase') || q.includes('subscription') || q.includes('billed') || q.includes('charge') || q.includes('refund') || q.includes('in-app') || q.includes('gift card') || q.includes('apple cash') || q.includes('apple arcade') || q.includes('daily cash')) {
    intent = 'App Store & In-App Purchases';
    confidence = 0.91;
    draftReply = "For billing and subscription questions, review your active subscriptions at reportaproblem.apple.com or under Settings > [Your Name] > Subscriptions.";
  } else if (q.includes('wifi') || q.includes('wi-fi') || q.includes('bluetooth') || q.includes('cellular') || q.includes('airpods') || q.includes('disconnect') || q.includes('no service') || q.includes('hotspot') || q.includes('esim') || q.includes('5g') || q.includes('antenna') || q.includes('sos only')) {
    intent = 'Connectivity (Wi-Fi, Cellular, Bluetooth)';
    confidence = 0.90;
    draftReply = "Let's get your connection working. Try toggling Airplane Mode on for 10 seconds, then off. You can also reset network settings in Settings > General > Transfer or Reset iPhone > Reset > Reset Network Settings.";
  }

  const words = cleanQuery.trim().split(/\s+/).filter(Boolean);
  const isGenericGreeting = words.length <= 2 && (q.includes('hi') || q.includes('hello') || q.includes('help'));
  const hasSpecificAppleKeyword = q.includes('iphone') || q.includes('ipad') || q.includes('mac') || q.includes('watch') || q.includes('apple') || q.includes('ios') || q.includes('icloud') || q.includes('airpods');

  if ((words.length <= 3 && !isGenericGreeting) || (words.length <= 5 && !hasSpecificAppleKeyword && (q.includes('did the thing') || q.includes('broken') || q.includes('not working')))) {
    confidence = 0.58;
  }

  const guard = evaluateDeterministicEscalationRules(cleanQuery, { intent_confidence: confidence });
  if (guard.mustEscalate) {
    decision = 'ESCALATE';
    escalationReason = guard.reason;
    if (guard.reason.includes('safety')) {
      draftReply = "Your safety is our top priority. Please immediately discontinue use and charging of this device. We are escalating this to our Senior Safety Engineers.";
    } else if (guard.reason.includes('theft') || guard.reason.includes('damage')) {
      draftReply = "We understand how concerning this situation is. We are escalating your case to our Senior Hardware & Security support team.";
    } else if (guard.reason.includes('authentication') || guard.reason.includes('dispute')) {
      draftReply = "To safeguard your personal data, we never handle credentials or billing details on public feeds. Please DM us your Apple ID or visit iforgot.apple.com.";
    } else if (guard.reason.includes('Legal')) {
      draftReply = "We have escalated your file to our Executive Customer Relations team. A specialist will review your case details via private correspondence.";
    } else if (guard.reason.includes('confidence')) {
      draftReply = "We want to make sure you get the right support. A human specialist is reviewing your message.";
    }
  }

  return {
    intent,
    intent_confidence: confidence,
    draft_reply: validateAndSanitizeURLs(draftReply),
    decision,
    escalation_reason: escalationReason
  };
}

export async function processCustomerMessage(rawCustomerTweet, options = {}) {
  const startTime = Date.now();
  const cleanQuery = sanitizeAndMaskPII(rawCustomerTweet);

  if (!cleanQuery || cleanQuery.length === 0) {
    return {
      raw_query: rawCustomerTweet,
      sanitized_query: '',
      intent: 'General Inquiry & How-To',
      intent_confidence: 0.0,
      draft_reply: validateAndSanitizeURLs("Hello! We're here to help. Please let us know what Apple product or service you need assistance with."),
      decision: 'ESCALATE',
      escalation_reason: 'Empty or invalid message content.',
      latency_ms: Date.now() - startTime
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const retrievedPairs = retrieveRelevantHistoricalContext(cleanQuery, 3);
  const contextSnippet = retrievedPairs.length > 0
    ? retrievedPairs.map((p, idx) => `[Historical Example ${idx + 1}]\nCustomer: ${p.customer_query}\nAgent Resolution: ${p.historical_reply}`).join('\n\n')
    : 'No directly matching historical thread found. Rely on standard Apple Support procedures.';

  if (options.mockOnly || !apiKey || apiKey === 'your_openai_api_key_here' || apiQuotaExhausted) {
    const mockOutput = mockSimulateAgentResponse(cleanQuery);
    return {
      raw_query: rawCustomerTweet,
      sanitized_query: cleanQuery,
      ...mockOutput,
      draft_reply: validateAndSanitizeURLs(mockOutput.draft_reply),
      is_mock: true,
      latency_ms: Date.now() - startTime
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are the lead automated AI Support Agent for @AppleSupport on Twitter.
Your role is to classify the customer's intent, draft a grounded, empathetic, and concise reply in the signature Apple Support voice, and determine whether to AUTO_HANDLE or ESCALATE.

### TAXONOMY OF 6 INTENTS:
1. "Software & Update Issues" (iOS/macOS updates, app crashing, system freezing, storage calculations, boot loops)
2. "Hardware & Battery Malfunction" (Battery drain, speaker issues, microphone, physical screen defects, camera)
3. "Account, Apple ID & Security" (iCloud login, Apple ID password, 2FA codes, account lockout)
4. "App Store & In-App Purchases" (Subscriptions, unexpected charges, refund requests, App Store purchase errors)
5. "Connectivity (Wi-Fi, Cellular, Bluetooth)" (Wi-Fi disconnecting, Bluetooth pairing, AirPods drops, "No Service")
6. "General Inquiry & How-To" (Feature explanations, device compatibility, trade-in queries, settings locations)

### STRICT ESCALATION POLICIES:
You must mark decision as "ESCALATE" if ANY of the following apply:
1. Low Confidence: If your intent_confidence is < 0.75.
2. Hardware Safety Hazards: Any mention of battery swelling, bulging, smoke, sparks, fire, severe burns, or electric shock.
3. Hardware Damage / Stolen: Physically shattered hardware, liquid immersion, or stolen devices.
4. Private Authentication / Financial Disputes: Account password recovery, 2FA bypass, locked accounts, or refund disputes (which must not be handled publicly on Twitter).
5. Legal Action & Churn: Threats of lawsuits, attorneys, regulatory complaints, or hostile churn threats.

If none of the escalation triggers apply, mark decision as "AUTO_HANDLE", with escalation_reason = "N/A".

### GROUNDING GUIDELINES:
- Draft concise, professional, warm tweets (under 280 characters if possible).
- Use provided historical context when applicable.
- Never ask customers to post sensitive PII (passwords, payment cards, IMEI) publicly. Invite them to secure DM or official Apple Support links (e.g. iforgot.apple.com, reportaproblem.apple.com).

### HISTORICAL GROUNDING CONTEXT:
${contextSnippet}`;

  try {
    const response = await openai.beta.chat.completions.parse({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Customer Tweet: "${cleanQuery}"` }
      ],
      response_format: zodResponseFormat(SupportActionSchema, 'support_action'),
      temperature: 0.1
    });

    const parsed = response.choices[0].message.parsed;

    const guard = evaluateDeterministicEscalationRules(cleanQuery, parsed);
    let finalDecision = parsed.decision;
    let finalReason = parsed.escalation_reason;

    if (guard.mustEscalate && finalDecision !== 'ESCALATE') {
      finalDecision = 'ESCALATE';
      finalReason = guard.reason;
    }

    return {
      raw_query: rawCustomerTweet,
      sanitized_query: cleanQuery,
      intent: parsed.intent,
      intent_confidence: parsed.intent_confidence,
      draft_reply: validateAndSanitizeURLs(parsed.draft_reply),
      decision: finalDecision,
      escalation_reason: finalReason,
      is_mock: false,
      latency_ms: Date.now() - startTime
    };
  } catch (error) {
    if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('credits')))) {
      if (!apiQuotaExhausted) {
        console.warn('\n[Router] Notice: OpenAI API quota exhausted (429). Tripping circuit breaker to local fallback engine.');
        apiQuotaExhausted = true;
      }
    } else {
      console.error('[Router] OpenAI API Error:', error.message);
    }

    const fallback = mockSimulateAgentResponse(cleanQuery);
    return {
      raw_query: rawCustomerTweet,
      sanitized_query: cleanQuery,
      ...fallback,
      draft_reply: validateAndSanitizeURLs(fallback.draft_reply),
      error_fallback: true,
      error_details: error.message,
      latency_ms: Date.now() - startTime
    };
  }
}
