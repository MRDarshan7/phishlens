import { detectUrgencyKeywords } from './keywords';
import { analyzeLinks } from './urlAnalyzer';
import { analyzeAttachments } from './attachmentAnalyzer';
import { WEIGHTS } from '../data/weights';

const urgency = detectUrgencyKeywords('', 'Please VERIFY IMMEDIATELY to avoid suspended access.');
const verifyUrgency = urgency.find((indicator) => indicator.id === 'urgency-verify-immediately');
console.assert(urgency.length === 2, 'urgency detects distinct phrases case-insensitively');
console.assert(urgency.every((indicator) => indicator.points === WEIGHTS.urgencyKeyword && indicator.severity === 'medium'), 'urgency metadata is correct');
console.assert(verifyUrgency?.location?.field === 'body' && verifyUrgency.location.startIndex === 7 && verifyUrgency.location.endIndex === 25, 'urgency body span is accurate');
console.assert('VERIFY IMMEDIATELY' === 'Please VERIFY IMMEDIATELY to avoid suspended access.'.slice(7, 25), 'urgency span matches text');
const subjectUrgency = detectUrgencyKeywords('URGENT ACTION REQUIRED', 'Normal message');
console.assert(subjectUrgency[0]?.location?.field === 'subject', 'subject location is reported');
console.assert(detectUrgencyKeywords('', 'Your monthly report is ready for review.').length === 0, 'ordinary text has no urgency indicator');
console.assert(detectUrgencyKeywords('', 'unsuspended contact now').length === 0, 'substring false positives are prevented');
console.assert(detectUrgencyKeywords('', 'act now, suspended, urgent action required, limited time').length === 3, 'urgency is capped at three indicators');

const ipUrl = analyzeLinks([{ displayText: 'http://192.168.1.10:8080/login', href: 'http://192.168.1.10:8080/login' }]);
const ipIndicator = ipUrl.find((indicator) => indicator.id === 'ip-literal-url');
const httpIndicator = ipUrl.find((indicator) => indicator.id === 'non-https-url');
console.assert(ipIndicator?.points === WEIGHTS.ipLiteralUrl && ipIndicator.severity === 'high' && ipIndicator.evidence.includes('192.168.1.10'), 'IP indicator metadata is correct');
console.assert(httpIndicator?.points === WEIGHTS.nonHttpsLink && httpIndicator.severity === 'medium' && httpIndicator.evidence.includes('HTTP'), 'non-HTTPS indicator metadata is correct');
console.assert(analyzeLinks([{ displayText: 'https://example.com/login', href: 'https://example.com/login' }]).length === 0, 'matching HTTPS link is clean');
console.assert(analyzeLinks([{ displayText: 'Click here', href: 'https://example.com' }]).length === 0, 'generic display text has no mismatch');
const mismatch = analyzeLinks([{ displayText: 'https://paypal.com', href: 'http://paypa1-login.com/verify' }]);
console.assert(mismatch.some((indicator) => indicator.id === 'href-display-mismatch'), 'href/display mismatch is detected');
console.assert(mismatch.some((indicator) => indicator.id === 'non-https-url'), 'mismatch link also detects non-HTTPS');
const urlTyposquat = mismatch.find((indicator) => indicator.id === 'typosquat-domain');
console.assert(urlTyposquat?.points === WEIGHTS.typosquatUrlDomain && urlTyposquat.severity === 'critical', 'URL delegates typosquat detection with URL weight');
console.assert(urlTyposquat?.evidence.includes('paypa1'), 'delegated typosquat evidence is preserved');
console.assert(analyzeLinks([{ displayText: 'https://example.com', href: 'not a URL' }]).length === 0, 'invalid href is deterministic and emits no invented indicator');

const dangerousExtensions = ['exe', 'scr', 'js', 'vbs', 'bat', 'cmd', 'jar'];
for (const extension of dangerousExtensions) {
  const result = analyzeAttachments([{ name: `file.${extension.toUpperCase()}`, extension: extension.toUpperCase() }]);
  console.assert(result.length === 1, `${extension} is detected`);
  console.assert(result[0]?.id === 'dangerous-attachment-extension' && result[0]?.name === 'Dangerous attachment extension', `${extension} indicator identity is correct`);
  console.assert(result[0]?.points === WEIGHTS.dangerousAttachmentExtension && result[0]?.severity === 'high', `${extension} metadata is correct`);
  console.assert(result[0]?.evidence.includes(`file.${extension.toUpperCase()}`), `${extension} evidence names the file`);
}
const disguised = analyzeAttachments([{ name: 'invoice.pdf.exe', extension: 'pdf' }]);
console.assert(disguised.length === 1 && disguised[0]?.evidence.includes('double-extension'), 'double extension is detected from filename');
console.assert(analyzeAttachments([{ name: 'invoice.pdf', extension: 'pdf' }]).length === 0, 'safe PDF is clean');

console.log('Phase 2 canonical API tests passed');
