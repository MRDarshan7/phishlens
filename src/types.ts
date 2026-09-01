export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Indicator {
  id: string;
  name: string;
  evidence: string;
  points: number;
  severity: Severity;
  location?: {
    field: 'sender' | 'subject' | 'body' | 'url';
    startIndex: number;
    endIndex: number;
  };
}

export interface EmailLink {
  displayText: string;
  href: string;
}

export interface EmailAttachment {
  name: string;
  extension: string;
}

export interface EmailInput {
  sender: string;
  subject: string;
  body: string;
  links: EmailLink[];
  attachments: EmailAttachment[];
}

export interface AnalysisResult {
  email: EmailInput;
  indicators: Indicator[];
  score: number;
  verdict: Severity;
  evidenceStrength: 'strong' | 'weak';
  timestamp: string;
}

export interface IncidentReport {
  verdict: Severity;
  score: number;
  evidenceSummary: string[];
  iocs: {
    maliciousDomain?: string;
    maliciousUrl?: string;
    suspiciousSender?: string;
  };
  recommendedAction: string;
}
