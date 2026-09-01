import type { EmailInput } from '../types';

export const testEmails: { label: string; email: EmailInput }[] = [
  {
    label: 'Clean Legitimate Email',
    email: {
      sender: 'updates@acme.example',
      subject: 'Your monthly workspace summary',
      body: 'Hello Maya,\n\nYour workspace summary is ready to review. No action is needed.\n\nRegards,\nThe Acme Workspace Team',
      links: [],
      attachments: [],
    },
  },
  {
    label: 'Attachment-Based',
    email: {
      sender: 'billing@acme.example',
      subject: 'Invoice available for review',
      body: 'Hello Jordan,\n\nYour invoice is attached for your records. Review it at your convenience.\n\nAcme Accounts Team',
      links: [{ displayText: 'http://billing.example.com/invoice', href: 'http://billing.example.com/invoice' }],
      attachments: [{ name: 'invoice.pdf.exe', extension: 'pdf' }],
    },
  },
  {
    label: 'Borderline Case',
    email: {
      sender: 'notifications@asana.com',
      subject: 'Your weekly workspace digest',
      body: 'Dear Customer,\n\nYour workspace summary is ready. View it when convenient.\n\nThe Asana Team',
      links: [{ displayText: 'http://updates.example.com/preferences', href: 'http://updates.example.com/preferences' }],
      attachments: [],
    },
  },
  {
    label: 'Adversarial (No Urgency Keywords)',
    email: {
      sender: 'security@paypal-security.com',
      subject: 'Account security center',
      body: 'Hello Jordan,\n\nReview your account security settings using the secure link below.\n\nSecurity Operations',
      links: [
        { displayText: 'https://paypal.com', href: 'http://paypal-security.com/login' },
        { displayText: 'http://192.168.123.254/account', href: 'http://192.168.123.254/account' },
      ],
      attachments: [],
    },
  },
  {
    label: 'Obvious Phish',
    email: {
      sender: 'security@paypa1-login.com',
      subject: 'URGENT ACTION REQUIRED: Verify immediately',
      body: 'Please verify immediately. Your account will be suspended unless you complete this check.',
      links: [
        { displayText: 'https://paypal.com', href: 'http://paypa1-login.com/verify' },
        { displayText: 'http://192.168.1.20/verify', href: 'http://192.168.1.20/verify' },
      ],
      attachments: [{ name: 'account-review.pdf.exe', extension: 'pdf' }],
    },
  },
];
