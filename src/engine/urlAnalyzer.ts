import type { EmailLink, Indicator } from '../types';
import { WEIGHTS } from '../data/weights';

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function displayHostname(value: string): string | null {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const parsed = parseUrl(candidate);
  return parsed?.hostname.toLowerCase() ?? null;
}

function isIpv4(hostname: string): boolean {
  const parts = hostname.split('.');
  return parts.length === 4 && parts.every((part) => /^(?:0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
}

export function analyzeUrl(link: EmailLink): Indicator[] {
  const indicators: Indicator[] = [];
  const hrefUrl = parseUrl(link.href);
  if (!hrefUrl) return indicators;

  const hrefHostname = hrefUrl.hostname.toLowerCase();
  if (isIpv4(hrefHostname)) {
    indicators.push({
      id: 'ip-literal-url',
      name: 'IP-literal URL',
      evidence: `The link uses raw IP address ${hrefHostname} instead of a domain name.`,
      points: WEIGHTS.ipLiteralUrl,
      severity: 'high',
    });
  }

  if (hrefUrl.protocol.toLowerCase() !== 'https:') {
    indicators.push({
      id: 'non-https-url',
      name: 'Non-HTTPS link',
      evidence: `The link uses ${hrefUrl.protocol.replace(':', '').toUpperCase()} rather than HTTPS.`,
      points: WEIGHTS.nonHttpsLink,
      severity: 'medium',
    });
  }

  const displayHostnameValue = displayHostname(link.displayText);
  if (displayHostnameValue && displayHostnameValue !== hrefHostname) {
    indicators.push({
      id: 'href-display-mismatch',
      name: 'Href/display-text mismatch',
      evidence: `Displayed domain ${displayHostnameValue} differs from actual href domain ${hrefHostname}.`,
      points: WEIGHTS.hrefDisplayMismatch,
      severity: 'critical',
    });
  }

  return indicators;
}
