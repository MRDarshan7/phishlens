import type { EmailInput, Indicator } from '../types';
import { scoreEmail, runFullAnalysis } from './scorer';
import { WEIGHTS } from '../data/weights';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function indicator(points: number, id = 'test-signal'): Indicator {
  return { id, name: 'Test signal', evidence: 'test evidence', points, severity: 'medium' };
}

const boundaries: Array<[number, string]> = [
  [0, 'low'], [8, 'low'], [24, 'low'], [25, 'medium'], [49, 'medium'],
  [50, 'high'], [74, 'high'], [75, 'critical'], [100, 'critical'],
];
for (const [points, verdict] of boundaries) {
  const result = scoreEmail(points === 0 ? [] : [indicator(points)]);
  assert(result.score === points && result.verdict === verdict, `boundary ${points} failed`);
}
assert(scoreEmail([indicator(80), indicator(30)]).score === 100, 'score must cap at 100');
assert(scoreEmail([]).evidenceStrength === 'weak', 'empty evidence must be weak');
assert(scoreEmail([indicator(8, 'urgency-act-now')]).evidenceStrength === 'weak', 'one urgency indicator must be weak');
assert(scoreEmail([indicator(30, 'typosquat-domain')]).evidenceStrength === 'weak', 'one typosquat indicator must be weak');
assert(scoreEmail([indicator(8, 'urgency-first'), indicator(8, 'urgency-second')]).evidenceStrength === 'weak', 'repeated urgency must be weak');
assert(scoreEmail([indicator(30, 'typosquat-domain'), indicator(8, 'urgency-act-now')]).evidenceStrength === 'strong', 'domain plus urgency must be strong');
assert(scoreEmail([indicator(20, 'href-display-mismatch'), indicator(15, 'dangerous-attachment-extension')]).evidenceStrength === 'strong', 'URL plus attachment must be strong');

const cleanEmail: EmailInput = {
  sender: 'alerts@example.com', subject: 'Monthly report', body: 'Hello Alex, your report is ready.', links: [], attachments: [],
};
const clean = runFullAnalysis(cleanEmail);
assert(clean.indicators.length === 0 && clean.score === 0 && clean.verdict === 'low' && clean.evidenceStrength === 'weak', 'clean email analysis failed');

const mixedEmail: EmailInput = {
  sender: 'Security Team <security@paypa1-login.com>',
  subject: 'URGENT ACTION REQUIRED',
  body: 'Please verify immediately or your account will be suspended.',
  links: [{ displayText: 'https://paypal.com', href: 'http://paypa1-login.com/verify' }],
  attachments: [{ name: 'invoice.pdf.exe', extension: 'pdf' }],
};
const mixed = runFullAnalysis(mixedEmail);
assert(mixed.indicators.some((item) => item.id === 'typosquat-domain'), 'sender domain was not analyzed');
assert(mixed.indicators.some((item) => item.id.startsWith('urgency-')), 'urgency was not analyzed');
assert(mixed.indicators.some((item) => item.id === 'href-display-mismatch'), 'URL was not analyzed');
assert(mixed.indicators.some((item) => item.id === 'dangerous-attachment-extension'), 'attachment was not analyzed');
assert(mixed.evidenceStrength === 'strong' && mixed.score > 0, 'mixed analysis scoring failed');
assert(new Date(mixed.timestamp).toISOString() === mixed.timestamp, 'timestamp is not ISO');

const urgencyOnly = runFullAnalysis({
  sender: 'alerts@example.com', subject: '', body: 'Please act now.', links: [], attachments: [],
});
assert(urgencyOnly.indicators[0]?.points === WEIGHTS.urgencyKeyword && urgencyOnly.evidenceStrength === 'weak', 'urgency integration failed');

console.log('Phase 3 scorer tests passed');
