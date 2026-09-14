import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DOWNLOAD_PATH = 'C:\\Users\\aswin\\Downloads\\twcs.csv';
const LOCAL_RAW_PATH = path.join(PROJECT_ROOT, 'data', 'raw', 'twcs.csv');
const PROCESSED_DATA_DIR = path.join(PROJECT_ROOT, 'data', 'processed');
const OUTPUT_FILE_PATH = path.join(PROCESSED_DATA_DIR, 'apple_pairs.json');

export function sanitizeAndMaskPII(text) {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    '[EMAIL]'
  );

  sanitized = sanitized.replace(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    '[PHONE]'
  );

  sanitized = sanitized.replace(
    /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
    '[PAYMENT_CARD]'
  );

  sanitized = sanitized.replace(
    /\b(?:CAS|CASE|REF|ORD|REP)[-_#]?\d{5,12}\b/gi,
    '[CASE_ID]'
  );
  sanitized = sanitized.replace(
    /\b(?:order|case|repair)\s*(?:#|no\.?|id|number)?\s*[:\s]?\s*[A-Z0-9-]{6,15}\b/gi,
    '[ORDER_NUMBER]'
  );

  sanitized = sanitized.replace(
    /\b\d{15}\b/g,
    '[IMEI]'
  );
  sanitized = sanitized.replace(
    /\b(?:IMEI|SN|Serial\s*Number)[\s:#]*([A-Z0-9]{10,15})\b/gi,
    '[SERIAL_NUMBER]'
  );

  sanitized = sanitized.replace(/@([A-Za-z0-9_]+)/g, '');

  sanitized = sanitized.replace(
    /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    '[LINK]'
  );

  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized;
}

function resolveCsvSource(customPath) {
  if (customPath && fs.existsSync(customPath)) return customPath;
  if (fs.existsSync(DEFAULT_DOWNLOAD_PATH)) return DEFAULT_DOWNLOAD_PATH;
  if (fs.existsSync(LOCAL_RAW_PATH)) return LOCAL_RAW_PATH;
  return LOCAL_RAW_PATH;
}

export async function preprocessTwcsData(options = {}) {
  const inputArg = process.argv[2];
  const rawPath = resolveCsvSource(options.rawPath || inputArg);
  const outputPath = options.outputPath || OUTPUT_FILE_PATH;
  const maxPairs = options.maxPairs || parseInt(process.env.MAX_HISTORICAL_PAIRS, 10) || 5000;

  console.log(`[Preprocessor] Ingesting CSV from: ${rawPath}`);
  console.log(`[Preprocessor] Target output JSON: ${outputPath}`);
  console.log(`[Preprocessor] Target max pairs cap: ${maxPairs}`);

  if (!fs.existsSync(PROCESSED_DATA_DIR)) {
    fs.mkdirSync(PROCESSED_DATA_DIR, { recursive: true });
  }

  const customerTweetMap = new Map();
  const agentReplies = [];

  const fileStream = fs.createReadStream(rawPath, { encoding: 'utf8' });

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let appleRelatedRows = 0;

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      chunkSize: 1024 * 1024 * 8,
      chunk: (results, parser) => {
        for (const row of results.data) {
          rowCount++;

          if (!row.tweet_id || !row.text) continue;

          const text = row.text;
          const author = String(row.author_id || '').trim();
          const isAppleAuthor = author.toLowerCase() === 'applesupport';
          const mentionsApple = text.includes('@AppleSupport') || text.includes('AppleSupport');

          if (!isAppleAuthor && !mentionsApple) {
            continue;
          }

          appleRelatedRows++;
          const isInbound = String(row.inbound).toLowerCase() === 'true';
          const tweetId = String(row.tweet_id).trim();

          if (isAppleAuthor && !isInbound) {
            if (row.in_response_to_tweet_id) {
              agentReplies.push({
                tweet_id: tweetId,
                in_response_to_tweet_id: String(row.in_response_to_tweet_id).trim(),
                author_id: author,
                created_at: row.created_at || '',
                text: text
              });
            }
          } else if (isInbound || mentionsApple) {
            customerTweetMap.set(tweetId, {
              tweet_id: tweetId,
              created_at: row.created_at || '',
              text: text
            });
          }

          if (agentReplies.length >= maxPairs * 2) {
            parser.abort();
            break;
          }
        }

        if (rowCount % 100000 === 0) {
          console.log(`[Preprocessor] Processed ${rowCount.toLocaleString()} rows... (${appleRelatedRows.toLocaleString()} Apple-related)`);
        }
      },
      complete: () => {
        console.log(`[Preprocessor] Streaming complete.`);
        console.log(`[Preprocessor] Total rows parsed: ${rowCount.toLocaleString()}`);
        console.log(`[Preprocessor] Apple-related tweets identified: ${appleRelatedRows.toLocaleString()}`);
        console.log(`[Preprocessor] Inbound customer candidates: ${customerTweetMap.size.toLocaleString()}`);
        console.log(`[Preprocessor] Outbound Apple agent replies: ${agentReplies.length.toLocaleString()}`);

        const pairedData = [];
        const seenCustomerQueries = new Set();

        for (const agentTweet of agentReplies) {
          const customerTweet = customerTweetMap.get(agentTweet.in_response_to_tweet_id);
          if (customerTweet) {
            const cleanCustomer = sanitizeAndMaskPII(customerTweet.text);
            const cleanAgent = sanitizeAndMaskPII(agentTweet.text);

            if (cleanCustomer.length > 15 && cleanAgent.length > 15 && !seenCustomerQueries.has(cleanCustomer)) {
              seenCustomerQueries.add(cleanCustomer);
              pairedData.push({
                pair_id: `apple_${customerTweet.tweet_id}_${agentTweet.tweet_id}`,
                customer_tweet_id: customerTweet.tweet_id,
                agent_tweet_id: agentTweet.tweet_id,
                customer_query: cleanCustomer,
                historical_reply: cleanAgent,
                created_at: agentTweet.created_at
              });

              if (pairedData.length >= maxPairs) {
                break;
              }
            }
          }
        }

        console.log(`[Preprocessor] Successfully reconstructed ${pairedData.length.toLocaleString()} clean Apple customer-agent pairs.`);
        fs.writeFileSync(outputPath, JSON.stringify(pairedData, null, 2), 'utf8');
        console.log(`[Preprocessor] Saved to ${outputPath}`);
        resolve(pairedData);
      },
      error: (err) => {
        console.error('[Preprocessor] Fatal CSV streaming error:', err);
        reject(err);
      }
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  preprocessTwcsData()
    .then((pairs) => {
      console.log('\n[Preprocessor] Verification Sample 1:');
      console.log(JSON.stringify(pairs[0] || {}, null, 2));
      if (pairs[1]) {
        console.log('\n[Preprocessor] Verification Sample 2:');
        console.log(JSON.stringify(pairs[1], null, 2));
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Preprocessor] Execution failed:', err);
      process.exit(1);
    });
}
