import type { Indicator } from '../types';
import { BRAND_DOMAINS } from '../data/brandDomains';
import { WEIGHTS } from '../data/weights';

const MULTI_LABEL_SUFFIXES = new Set(['co.uk', 'com.au', 'co.in', 'co.jp', 'org.uk']);

function hostnameFromInput(value: string): string {
  let input = value.trim().toLowerCase();
  if (input.includes('@')) input = input.slice(input.lastIndexOf('@') + 1);
  input = input.replace(/^[a-z][a-z\d+.-]*:\/\//, '');
  input = input.split(/[/?#]/, 1)[0].replace(/:\d+$/, '').replace(/\.$/, '');

  try {
    return new URL(`http://${input}`).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return input;
  }
}

function registrableDomain(value: string): string {
  const hostname = hostnameFromInput(value);
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');

  const suffix = labels.slice(-2).join('.');
  return labels.slice(-(MULTI_LABEL_SUFFIXES.has(suffix) ? 3 : 2)).join('.');
}

function baseLabel(value: string): string {
  const registrable = registrableDomain(value);
  const labels = registrable.split('.');
  return labels[0] ?? '';
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function phishingNormalized(value: string): string {
  return value.replace(/rn/g, 'm').replace(/1/g, 'l').replace(/0/g, 'o');
}

function editMatch(left: string, right: string): { distance: number } | null {
  const rawDistance = levenshtein(left, right);
  const normalizedDistance = levenshtein(phishingNormalized(left), phishingNormalized(right));
  if (rawDistance <= 2) return { distance: rawDistance };
  if (normalizedDistance <= 2) return { distance: normalizedDistance };
  return null;
}

export function checkTyposquat(domain: string): Indicator | null {
  const hostname = hostnameFromInput(domain);
  const inputRegistrable = registrableDomain(hostname);
  const inputBase = baseLabel(hostname);
  if (!inputRegistrable || !inputBase) return null;

  const brandData = BRAND_DOMAINS.map((brand) => ({
    domain: registrableDomain(brand),
    base: baseLabel(brand),
  }));

  // A known brand's registrable domain, including any legitimate subdomain, is clean.
  if (brandData.some(({ domain: brandDomain }) => inputRegistrable === brandDomain)) return null;

  const candidates = [inputBase, ...inputBase.split('-').filter(Boolean)];
  for (const { domain: brandDomain, base: brandBase } of brandData) {
    for (const candidate of candidates) {
      // An exact brand segment is an affix case, not a character-edit typo.
      if (candidate === brandBase) continue;
      const match = editMatch(candidate, brandBase);
      if (match) {
        return {
          id: 'typosquat-domain',
          name: 'Typosquatted brand domain',
          evidence: `${hostname}: the ${candidate === inputBase ? 'base label' : 'segment'} '${candidate}' is ${match.distance} character edit${match.distance === 1 ? '' : 's'} from '${brandBase}'.`,
          points: WEIGHTS.typosquatSenderDomain,
          severity: 'critical',
        };
      }
    }
  }

  const hostnameLabels = hostname.split('.');
  for (const { domain: brandDomain, base: brandBase } of brandData) {
    if (inputBase.includes(brandBase) || hostnameLabels.some((label) => label.includes(brandBase))) {
      return {
        id: 'suspicious-domain-affix',
        name: 'Suspicious brand domain affix',
        evidence: `${hostname}: contains the exact brand name '${brandBase}' but is not the brand's real domain (${brandDomain}).`,
        points: WEIGHTS.suspiciousDomainAffix,
        severity: 'high',
      };
    }
  }

  return null;
}
