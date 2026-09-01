import type { Indicator } from '../types';
import { WEIGHTS } from '../data/weights';

const URGENCY_PHRASES = [
  'suspended',
  'verify immediately',
  'act now',
  'your account will be',
  'unauthorized access',
  'click here immediately',
  'confirm your identity',
  'limited time',
  'failure to respond',
  'urgent action required',
];

function evidenceAround(text: string, start: number, end: number): string {
  const contextStart = Math.max(0, text.lastIndexOf(' ', start - 1 - 40) + 1);
  const contextEnd = Math.min(text.length, text.indexOf(' ', end + 40) === -1 ? text.length : text.indexOf(' ', end + 40));
  return text.slice(contextStart, contextEnd).trim();
}

export function checkUrgency(text: string): Indicator[] {
  const indicators: Indicator[] = [];

  for (const phrase of URGENCY_PHRASES) {
    if (indicators.length === 3) break;
    const match = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(text);
    if (!match || match.index === undefined) continue;

    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    indicators.push({
      id: `urgency-${phrase.replace(/\s+/g, '-')}`,
      name: 'Urgency language',
      evidence: evidenceAround(text, startIndex, endIndex),
      points: WEIGHTS.urgencyKeyword,
      severity: 'medium',
      location: { field: 'body', startIndex, endIndex },
    });
  }

  return indicators;
}
