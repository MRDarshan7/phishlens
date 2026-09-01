import { runFullAnalysis } from '../engine/scorer';
import { testEmails } from './testEmails';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectedScore(indicators: ReturnType<typeof runFullAnalysis>['indicators']): number {
  return Math.min(100, indicators.reduce((total, item) => total + item.points, 0));
}

assert(testEmails.length === 5, 'exactly five curated emails are required');
assert(new Set(testEmails.map(({ label }) => label)).size === 5, 'demo labels must be unique');

const results = testEmails.map(({ email }) => runFullAnalysis(email));
for (const [index, result] of results.entries()) {
  assert(result.score === expectedScore(result.indicators), `${testEmails[index].label}: score math mismatch`);
  assert(result.timestamp === new Date(result.timestamp).toISOString(), `${testEmails[index].label}: invalid timestamp`);
}

const clean = results[0];
assert(clean.indicators.length === 0 && clean.score === 0 && clean.verdict === 'low' && clean.evidenceStrength === 'weak', 'clean scenario mismatch');

const attachmentBased = results[1];
assert(attachmentBased.score === 25 && attachmentBased.verdict === 'medium' && attachmentBased.evidenceStrength === 'strong', 'attachment scenario mismatch');
assert(attachmentBased.indicators.map(({ id }) => id).includes('dangerous-attachment-extension'), 'attachment indicator missing');

const borderline = results[2];
assert(borderline.score === 10 && borderline.verdict === 'low' && borderline.evidenceStrength === 'weak', 'borderline scenario mismatch');
assert(borderline.indicators.map(({ id }) => id).includes('non-https-url'), 'borderline non-HTTPS indicator missing');

const adversarial = results[3];
assert(adversarial.score === 95 && adversarial.verdict === 'critical' && adversarial.evidenceStrength === 'strong', 'adversarial scenario mismatch');
assert(!adversarial.indicators.some(({ id }) => id.startsWith('urgency-')), 'adversarial scenario must contain no urgency indicators');
assert(adversarial.indicators.some(({ id }) => id === 'suspicious-domain-affix'), 'adversarial sender affix missing');
assert(adversarial.indicators.some(({ id }) => id === 'href-display-mismatch'), 'adversarial mismatch missing');
assert(adversarial.indicators.some(({ id }) => id === 'ip-literal-url'), 'adversarial IP indicator missing');

const obviousPhish = results[4];
assert(obviousPhish.score === 100 && obviousPhish.verdict === 'critical' && obviousPhish.evidenceStrength === 'strong', 'obvious phish scenario mismatch');
assert(obviousPhish.indicators.some(({ id }) => id === 'typosquat-domain'), 'obvious phish sender typo missing');
assert(obviousPhish.indicators.some(({ id }) => id.startsWith('urgency-')), 'obvious phish urgency missing');
assert(obviousPhish.indicators.some(({ id }) => id === 'href-display-mismatch'), 'obvious phish mismatch missing');
assert(obviousPhish.indicators.some(({ id }) => id === 'dangerous-attachment-extension'), 'obvious phish attachment missing');

console.log('Phase 4 curated email tests passed');
