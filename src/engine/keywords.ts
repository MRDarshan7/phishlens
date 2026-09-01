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

function evidenceAround(text: string, startIndex: number, endIndex: number): string {
  const contextStart = Math.max(0, text.lastIndexOf(' ', Math.max(0, startIndex - 40)) + 1);
  const nextSpace = text.indexOf(' ', endIndex + 40);
  const contextEnd = nextSpace === -1 ? text.length : nextSpace;
  return text.slice(contextStart, contextEnd).trim();
}

function findPhrase(text: string, phrase: string): RegExpExecArray | null {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').exec(text);
}

export function detectUrgencyKeywords(subject: string, body: string): Indicator[] {
  const indicators: Indicator[] = [];

  for (const phrase of URGENCY_PHRASES) {
    if (indicators.length >= 3) break;

    const subjectMatch = findPhrase(subject, phrase);
    const field = subjectMatch ? 'subject' : 'body';
    const source = subjectMatch ? subject : body;
    const match = subjectMatch ?? findPhrase(body, phrase);
    if (!match || match.index === undefined) continue;

    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    indicators.push({
      id: `urgency-${phrase.replace(/\s+/g, '-')}`,
      name: 'Urgency language',
      evidence: evidenceAround(source, startIndex, endIndex),
      points: WEIGHTS.urgencyKeyword,
      severity: 'medium',
      location: { field, startIndex, endIndex },
    });
  }

  return indicators;
}
