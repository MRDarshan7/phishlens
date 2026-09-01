import type { EmailAttachment, Indicator } from '../types';
import { WEIGHTS } from '../data/weights';

const DANGEROUS_EXTENSIONS = new Set(['exe', 'scr', 'js', 'vbs', 'bat', 'cmd', 'jar']);

export function analyzeAttachments(attachments: EmailAttachment[]): Indicator[] {
  return attachments.flatMap((attachment) => {
    const extension = attachment.extension.trim().replace(/^\./, '').toLowerCase();
    const filename = attachment.name.trim();
    const filenameParts = filename.split('.').filter(Boolean);
    const finalExtension = filenameParts[filenameParts.length - 1]?.toLowerCase() ?? '';
    const isDangerous = DANGEROUS_EXTENSIONS.has(extension);
    const isDoubleExtension = filenameParts.length >= 3 && DANGEROUS_EXTENSIONS.has(finalExtension);
    if (!isDangerous && !isDoubleExtension) return [];

    const reason = isDoubleExtension
      ? `uses a double-extension disguise with dangerous final extension '${finalExtension}'`
      : `has dangerous extension '${extension}'`;
    return [{
      id: 'dangerous-attachment-extension',
      name: 'Dangerous attachment extension',
      evidence: `Attachment '${filename}' ${reason}.`,
      points: WEIGHTS.dangerousAttachmentExtension,
      severity: 'high',
    }];
  });
}
