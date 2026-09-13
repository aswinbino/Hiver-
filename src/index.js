import dotenv from 'dotenv';
import { processCustomerMessage } from './router.js';

dotenv.config();

const SAMPLE_CUSTOMER_TWEETS = [
  {
    category: 'Auto-Handle: Software & Update',
    tweet: '@AppleSupport My iPhone 13 froze during the iOS 17.4 update progress bar. What should I do?'
  },
  {
    category: 'Auto-Handle: Connectivity',
    tweet: '@AppleSupport Wi-Fi keeps dropping every few minutes on my MacBook Air running Sonoma, but works on my iPad.'
  },
  {
    category: 'Auto-Handle: General How-To',
    tweet: '@AppleSupport How do I enable Night Shift on my iPad Pro? Can’t find the toggle.'
  },
  {
    category: 'Safety Escalation: Swollen Battery Hazard',
    tweet: '@AppleSupport Help! My iPhone battery is bulging and pushing the screen out, and the device is burning hot!'
  },
  {
    category: 'Security Escalation: Password Reset & PII Masking',
    tweet: '@AppleSupport I forgot my Apple ID password! My email is test.user@example.com and phone is +1 (555) 349-2810. Case CAS-883921.'
  },
  {
    category: 'Legal Escalation: Hostile Lawsuit Threat',
    tweet: '@AppleSupport If you don’t replace my damaged MacBook tomorrow, my attorney is filing a class action lawsuit against Apple!'
  },
  {
    category: 'Low Confidence Escalation: Ambiguous Input',
    tweet: '@AppleSupport it did the thing again'
  }
];

async function runDemo() {
  console.log('================================================================================');
  console.log('       @AppleSupport Twitter AI Agent - Live Test & Validation Pipeline');
  console.log('================================================================================\n');

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
  console.log(`[Status] OpenAI Engine: ${hasApiKey ? 'LIVE (OpenAI gpt-4o-mini)' : 'LOCAL SIMULATOR (Set OPENAI_API_KEY for live calls)'}\n`);

  for (let i = 0; i < SAMPLE_CUSTOMER_TWEETS.length; i++) {
    const sample = SAMPLE_CUSTOMER_TWEETS[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[TEST CASE ${i + 1}/${SAMPLE_CUSTOMER_TWEETS.length}] Scenario: ${sample.category}`);
    console.log(`Incoming Raw Tweet:\n  "${sample.tweet}"`);

    const result = await processCustomerMessage(sample.tweet);

    console.log(`\nAgent Structured Output:`);
    console.log(`  Intent:            ${result.intent}`);
    console.log(`  Confidence:        ${(result.intent_confidence * 100).toFixed(1)}%`);
    console.log(`  Decision:          ${result.decision === 'AUTO_HANDLE' ? '✅ AUTO_HANDLE' : '🚨 ESCALATE'}`);
    console.log(`  Escalation Reason: ${result.escalation_reason}`);
    console.log(`  Sanitized Query:   "${result.sanitized_query}"`);
    console.log(`  Draft Reply:       "${result.draft_reply}"`);
    console.log(`  Latency:           ${result.latency_ms}ms`);
    console.log('--------------------------------------------------------------------------------\n');
  }

  console.log('================================================================================');
  console.log('✅ Demo execution completed successfully.');
  console.log('================================================================================\n');
}

runDemo().catch((err) => {
  console.error('Fatal execution error in index.js:', err);
  process.exit(1);
});
