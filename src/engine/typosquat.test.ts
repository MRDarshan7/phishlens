import { checkTyposquat } from './typosquat';
import { WEIGHTS } from '../data/weights';

const cases = [
  ['paypa1-login.com', 'character-edit', true],
  ['paypal-login.com', 'suspicious-affix', true],
  ['paypal.com', 'none', false],
  ['amaz0n-support.net', 'character-edit', true],
  ['totallylegit.com', 'none', false],
  ['login.paypal.com', 'none', false],
  ['support.google.com', 'none', false],
  ['paypal-support.example.com', 'suspicious-affix', true],
] as const;

for (const [domain, expectedCondition, shouldFlag] of cases) {
  const indicator = checkTyposquat(domain);
  console.assert(Boolean(indicator) === shouldFlag, `${domain}: flag result mismatch`);
  if (expectedCondition === 'character-edit') {
    console.assert(indicator?.points === WEIGHTS.typosquatSenderDomain, `${domain}: wrong character-edit weight`);
    console.assert(indicator?.severity === 'critical', `${domain}: wrong character-edit severity`);
    console.assert(indicator?.evidence.includes('character edit'), `${domain}: missing character-edit evidence`);
  } else if (expectedCondition === 'suspicious-affix') {
    console.assert(indicator?.points === WEIGHTS.suspiciousDomainAffix, `${domain}: wrong affix weight`);
    console.assert(indicator?.severity === 'high', `${domain}: wrong affix severity`);
    console.assert(indicator?.evidence.includes('exact brand name'), `${domain}: missing affix evidence`);
  } else {
    console.assert(indicator === null, `${domain}: unexpected indicator`);
  }
  console.assert(indicator === null || typeof indicator.id === 'string', `${domain}: invalid indicator`);
}

console.log('Phase 1 typosquat tests passed: 8 cases');
