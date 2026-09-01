import { checkUrgency } from './urgency';
import { analyzeUrl } from './urlAnalyzer';
import { analyzeAttachment } from './attachmentAnalyzer';
import { WEIGHTS } from '../data/weights';

const urgency = checkUrgency('Please VERIFY IMMEDIATELY to avoid suspended access.');
console.assert(urgency.length === 2, 'urgency detects distinct phrases case-insensitively');
console.assert(urgency.every((indicator) => indicator.points === WEIGHTS.urgencyKeyword && indicator.severity === 'medium'), 'urgency metadata is correct');
console.assert(checkUrgency('Your monthly report is ready for review.').length === 0, 'ordinary text has no urgency indicator');
console.assert(checkUrgency('act now, suspended, urgent action required, limited time').length === 3, 'urgency is capped at three indicators');

const ipUrl = analyzeUrl({ displayText: 'http://192.168.1.10/login', href: 'http://192.168.1.10/login' });
console.assert(ipUrl.some((indicator) => indicator.id === 'ip-literal-url'), 'IPv4 literal is detected');
console.assert(ipUrl.some((indicator) => indicator.id === 'non-https-url'), 'non-HTTPS is detected');
console.assert(analyzeUrl({ displayText: 'https://example.com', href: 'https://example.com:8443/path' }).length === 0, 'matching HTTPS domain with port is clean');
const mismatch = analyzeUrl({ displayText: 'https://paypal.com', href: 'http://paypa1-login.com/verify' });
console.assert(mismatch.length === 2 && mismatch.some((indicator) => indicator.id === 'href-display-mismatch'), 'href/display mismatch is detected structurally');
console.assert(analyzeUrl({ displayText: 'Example domain', href: 'https://example.com' }).length === 0, 'plain display text does not create mismatch');

for (const attachment of [
  { name: 'invoice.exe', extension: 'exe' },
  { name: 'invoice.pdf.exe', extension: 'EXE' },
  { name: 'script.JS', extension: '.JS' },
]) {
  const result = analyzeAttachment(attachment);
  console.assert(result.length === 1, `${attachment.name} is detected`);
  console.assert(result[0]?.points === WEIGHTS.dangerousAttachmentExtension && result[0]?.severity === 'high', `${attachment.name} metadata is correct`);
}
console.assert(analyzeAttachment({ name: 'report.pdf', extension: 'pdf' }).length === 0, 'safe attachment is clean');

console.log('Phase 2 tests passed: urgency, URL, and attachment analyzers');
