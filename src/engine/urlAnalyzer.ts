import type { EmailLink, Indicator } from '../types';
import { WEIGHTS } from '../data/weights';
import { checkTyposquat } from './typosquat';

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function displayHostname(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^[^\s./]+\.[^\s./]+(?::\d+)?(?:\/|$)/i.test(trimmed)) {
    return null;
  }
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const parsed = parseUrl(candidate);
  return parsed?.hostname.toLowerCase() ?? null;
}

function isIpv4(hostname: string): boolean {
  const parts = hostname.split('.');
  return parts.length === 4 && parts.every((part) => /^(?:0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
}

export function analyzeLinks(links: EmailLink[]): Indicator[] {
  const indicators: Indicator[] = [];
  const typosquatDomains = new Set<string>();

  for (const link of links) {
    const hrefUrl = parseUrl(link.href);
    if (!hrefUrl) continue;

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

    if (!typosquatDomains.has(hrefHostname)) {
      const typosquat = checkTyposquat(hrefHostname);
      if (typosquat) {
        typosquatDomains.add(hrefHostname);
        indicators.push({ ...typosquat, points: WEIGHTS.typosquatUrlDomain });
      }
    }
  }

  return indicators;
}
