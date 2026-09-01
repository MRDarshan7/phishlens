export const WEIGHTS = {
  // Base label is a close edit-distance match to a known brand in a sender domain.
  typosquatSenderDomain: 30,
  // Domain contains an exact brand name but is not that brand's real domain.
  suspiciousDomainAffix: 10,
  // Base label of a link href domain is a close edit-distance match to a known brand.
  typosquatUrlDomain: 25,
  // A link's displayed domain differs from its actual href domain.
  hrefDisplayMismatch: 20,
  // Link href uses a raw IP address instead of a domain name.
  ipLiteralUrl: 20,
  // Each matched urgency phrase, with a maximum of three counted per email.
  urgencyKeyword: 8,
  // Link href does not use HTTPS.
  nonHttpsLink: 10,
  // Attachment extension is dangerous, or a double-extension disguise such as invoice.pdf.exe is used.
  dangerousAttachmentExtension: 15,
  // Body opens with a generic greeting instead of a personalized name.
  genericGreeting: 5,
} as const;
