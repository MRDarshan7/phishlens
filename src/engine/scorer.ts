import type { AnalysisResult, EmailInput, Indicator, Severity } from '../types';
import { analyzeAttachments } from './attachmentAnalyzer';
import { checkTyposquat } from './typosquat';
import { detectUrgencyKeywords } from './keywords';
import { analyzeLinks } from './urlAnalyzer';

type EvidenceStrength = 'strong' | 'weak';

function signalType(indicator: Indicator): string | null {
  const id = indicator.id.toLowerCase();
  const name = indicator.name.toLowerCase();

  if (id.startsWith('urgency-') || name.includes('urgency')) return 'urgency';
  if (id.includes('typosquat') || id.includes('domain-affix') || name.includes('domain')) return 'domain';
  if (id === 'ip-literal-url' || id === 'non-https-url' || id === 'href-display-mismatch' || name.includes('url') || name.includes('https')) return 'url';
  if (id.includes('attachment') || name.includes('attachment')) return 'attachment';
  if (id.includes('greeting') || name.includes('greeting')) return 'greeting';
  return null;
}

function evidenceStrength(indicators: Indicator[]): EvidenceStrength {
  if (indicators.length <= 1) return 'weak';

  const independentTypes = new Set(
    indicators.map(signalType).filter((type): type is string => type !== null),
  );

  // Strength describes independent and consistent evidence, not phishing probability.
  // Weak results should later surface in the UI as “needs human review”.
  return independentTypes.size >= 2 ? 'strong' : 'weak';
}

export function scoreEmail(indicators: Indicator[]): {
  score: number;
  verdict: Severity;
  evidenceStrength: EvidenceStrength;
} {
  const score = Math.max(0, Math.min(100, indicators.reduce((total, indicator) => total + indicator.points, 0)));
  const verdict: Severity = score >= 75
    ? 'critical'
    : score >= 50
      ? 'high'
      : score >= 25
        ? 'medium'
        : 'low';

  return { score, verdict, evidenceStrength: evidenceStrength(indicators) };
}

function senderDomain(sender: string): string {
  const angleAddress = sender.match(/<([^>]+)>/)?.[1] ?? sender;
  const atIndex = angleAddress.lastIndexOf('@');
  return atIndex === -1 ? angleAddress.trim() : angleAddress.slice(atIndex + 1).trim();
}

export function runFullAnalysis(email: EmailInput): AnalysisResult {
  const indicators: Indicator[] = [];
  const senderIndicator = checkTyposquat(senderDomain(email.sender));
  if (senderIndicator) indicators.push(senderIndicator);

  indicators.push(...detectUrgencyKeywords(email.subject, email.body));
  indicators.push(...analyzeLinks(email.links));
  indicators.push(...analyzeAttachments(email.attachments));

  const scored = scoreEmail(indicators);
  return {
    email,
    indicators,
    score: scored.score,
    verdict: scored.verdict,
    evidenceStrength: scored.evidenceStrength,
    timestamp: new Date().toISOString(),
  };
}
