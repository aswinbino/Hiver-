import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processCustomerMessage, INTENT_CATEGORIES } from '../src/router.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const GOLDEN_SET_PATH = path.join(PROJECT_ROOT, 'data', 'golden_set.json');
const RESULTS_OUTPUT_PATH = path.join(PROJECT_ROOT, 'eval', 'eval_results.json');

/**
 * Calculates classification metrics (Precision, Recall, F1, Macro F1)
 */
export function calculateIntentMetrics(confusionMatrix, categories) {
  const metricsPerClass = {};
  let sumF1 = 0;
  let validClasses = 0;

  for (const cat of categories) {
    const tp = confusionMatrix[cat][cat] || 0;
    let fp = 0;
    let fn = 0;

    for (const otherCat of categories) {
      if (otherCat !== cat) {
        fp += confusionMatrix[otherCat][cat] || 0;
        fn += confusionMatrix[cat][otherCat] || 0;
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    metricsPerClass[cat] = {
      tp,
      fp,
      fn,
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1: parseFloat(f1.toFixed(4)),
      support: tp + fn
    };

    sumF1 += f1;
    validClasses++;
  }

  const macroF1 = validClasses > 0 ? sumF1 / validClasses : 0;

  return {
    macroF1: parseFloat(macroF1.toFixed(4)),
    perClass: metricsPerClass
  };
}

/**
 * Calculates Binary Escalation Metrics (Precision, Recall, F1)
 */
export function calculateEscalationMetrics(predictions) {
  let tp = 0; // True decision ESCALATE, Predicted ESCALATE
  let fp = 0; // True decision AUTO_HANDLE, Predicted ESCALATE
  let fn = 0; // True decision ESCALATE, Predicted AUTO_HANDLE
  let tn = 0; // True decision AUTO_HANDLE, Predicted AUTO_HANDLE

  for (const p of predictions) {
    const actual = p.true_decision;
    const pred = p.predicted_decision;

    if (actual === 'ESCALATE' && pred === 'ESCALATE') tp++;
    else if (actual === 'AUTO_HANDLE' && pred === 'ESCALATE') fp++;
    else if (actual === 'ESCALATE' && pred === 'AUTO_HANDLE') fn++;
    else if (actual === 'AUTO_HANDLE' && pred === 'AUTO_HANDLE') tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / (tp + tn + fp + fn);

  return {
    tp,
    fp,
    fn,
    tn,
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    f1: parseFloat(f1.toFixed(4)),
    accuracy: parseFloat(accuracy.toFixed(4))
  };
}

/**
 * Main Evaluation Harness Runner
 */
export async function runEvaluationHarness(options = {}) {
  console.log('================================================================================');
  console.log('       Apple Support AI Agent - Automated Evaluation Benchmark Harness');
  console.log('================================================================================\n');

  if (!fs.existsSync(GOLDEN_SET_PATH)) {
    throw new Error(`Golden dataset not found at: ${GOLDEN_SET_PATH}. Please run data/build_golden_set.js first.`);
  }

  const goldenData = JSON.parse(fs.readFileSync(GOLDEN_SET_PATH, 'utf8'));
  const limit = options.limit || parseInt(process.env.EVAL_SAMPLE_LIMIT, 10) || goldenData.length;
  const testSamples = goldenData.slice(0, limit);

  console.log(`[Eval] Loaded ${goldenData.length} golden items. Evaluating ${testSamples.length} samples...`);

  // Initialize confusion matrix
  const confusionMatrix = {};
  for (const c1 of INTENT_CATEGORIES) {
    confusionMatrix[c1] = {};
    for (const c2 of INTENT_CATEGORIES) {
      confusionMatrix[c1][c2] = 0;
    }
  }

  const predictions = [];
  const latencies = [];
  const startTime = Date.now();

  for (let i = 0; i < testSamples.length; i++) {
    const item = testSamples[i];

    const result = await processCustomerMessage(item.customer_query, {
      mockOnly: options.mockOnly
    });

    latencies.push(result.latency_ms);

    const predIntent = INTENT_CATEGORIES.includes(result.intent) ? result.intent : 'General Inquiry & How-To';
    const trueIntent = item.ground_truth_intent;

    confusionMatrix[trueIntent][predIntent] = (confusionMatrix[trueIntent][predIntent] || 0) + 1;

    predictions.push({
      id: item.id,
      query: item.customer_query,
      true_intent: trueIntent,
      predicted_intent: predIntent,
      true_decision: item.true_decision,
      predicted_decision: result.decision,
      escalation_reason: result.escalation_reason,
      draft_reply: result.draft_reply,
      ground_truth_reply: item.ground_truth_reply,
      confidence: result.intent_confidence,
      latency_ms: result.latency_ms,
      is_mock: result.is_mock
    });

    if ((i + 1) % 25 === 0 || i === testSamples.length - 1) {
      const pct = Math.round(((i + 1) / testSamples.length) * 100);
      console.log(`[Eval Progress] Evaluated ${i + 1}/${testSamples.length} (${pct}%)...`);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Compute Metrics
  const intentMetrics = calculateIntentMetrics(confusionMatrix, INTENT_CATEGORIES);
  const escalationMetrics = calculateEscalationMetrics(predictions);

  // Latency Metrics
  latencies.sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50Latency = latencies[Math.floor(latencies.length * 0.5)];
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];

  const summaryReport = {
    benchmark_timestamp: new Date().toISOString(),
    total_evaluated: testSamples.length,
    elapsed_seconds: parseFloat(totalTimeSec),
    latency: {
      avg_ms: avgLatency,
      p50_ms: p50Latency,
      p95_ms: p95Latency
    },
    intent_classification: {
      macro_f1: intentMetrics.macroF1,
      per_class_f1: Object.fromEntries(
        Object.entries(intentMetrics.perClass).map(([k, v]) => [k, { f1: v.f1, precision: v.precision, recall: v.recall, support: v.support }])
      )
    },
    escalation_policy: {
      precision: escalationMetrics.precision,
      recall: escalationMetrics.recall,
      f1: escalationMetrics.f1,
      accuracy: escalationMetrics.accuracy,
      confusion: {
        true_positives_escalated: escalationMetrics.tp,
        false_positives_over_escalated: escalationMetrics.fp,
        false_negatives_missed_escalations: escalationMetrics.fn,
        true_negatives_auto_handled: escalationMetrics.tn
      }
    },
    predictions
  };

  fs.writeFileSync(RESULTS_OUTPUT_PATH, JSON.stringify(summaryReport, null, 2), 'utf8');

  // Print Executive Results Dashboard
  console.log('\n================================================================================');
  console.log('                          BENCHMARK HEADLINE RESULTS');
  console.log('================================================================================');
  console.log(`Evaluated Samples:       ${testSamples.length}`);
  console.log(`Elapsed Runtime:         ${totalTimeSec}s`);
  console.log(`Average Latency:         ${avgLatency}ms (p95: ${p95Latency}ms)`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Intent Macro F1:         ${(intentMetrics.macroF1 * 100).toFixed(2)}%`);
  console.log(`Escalation Precision:    ${(escalationMetrics.precision * 100).toFixed(2)}%`);
  console.log(`Escalation Recall:       ${(escalationMetrics.recall * 100).toFixed(2)}%`);
  console.log(`Escalation F1-Score:     ${(escalationMetrics.f1 * 100).toFixed(2)}%`);
  console.log('--------------------------------------------------------------------------------');
  console.log('Intent Breakdown:');
  for (const [intent, m] of Object.entries(intentMetrics.perClass)) {
    console.log(`  • ${intent.padEnd(42)}: F1=${(m.f1 * 100).toFixed(1)}% | P=${(m.precision * 100).toFixed(1)}% | R=${(m.recall * 100).toFixed(1)}% (N=${m.support})`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`Full evaluation details saved to: ${RESULTS_OUTPUT_PATH}`);
  console.log('================================================================================\n');

  return summaryReport;
}

// CLI Direct Invocation
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isMock = process.argv.includes('--mock');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  runEvaluationHarness({ mockOnly: isMock, limit })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Eval] Error running evaluation:', err);
      process.exit(1);
    });
}
