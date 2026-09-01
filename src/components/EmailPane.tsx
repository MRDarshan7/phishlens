import type { ChangeEvent, ReactNode } from 'react';
import type { AnalysisResult, EmailInput, Indicator, Severity } from '../types';

const severityOrder: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

interface EmailPaneProps {
  email: EmailInput;
  result: AnalysisResult | null;
  queue: { label: string; email: EmailInput; result: AnalysisResult }[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onChange: (email: EmailInput) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

type HighlightField = 'sender' | 'subject' | 'body' | 'url';

function fieldValue(indicator: Indicator, field: HighlightField) {
  return indicator.location?.field === field ? indicator : null;
}

function highlightedText(text: string, field: HighlightField, indicators: Indicator[]): ReactNode {
  const spans = indicators
    .filter((indicator) => fieldValue(indicator, field) && indicator.location)
    .map((indicator) => ({ indicator, start: indicator.location!.startIndex, end: indicator.location!.endIndex }))
    .filter(({ start, end }) => start >= 0 && end > start && end <= text.length)
    .sort((a, b) => a.start - b.start || severityOrder[b.indicator.severity] - severityOrder[a.indicator.severity]);

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const span of spans) {
    // Overlapping spans cannot be nested safely; severity order makes the choice deterministic.
    if (span.start < cursor) continue;
    if (span.start > cursor) parts.push(text.slice(cursor, span.start));
    parts.push(
      <span className={`evidence-highlight evidence-${span.indicator.severity}`} tabIndex={0} title={span.indicator.evidence} key={`${span.indicator.id}-${span.start}`}>
        {text.slice(span.start, span.end)}
        <span className="evidence-popover" role="tooltip">{span.indicator.evidence}</span>
      </span>,
    );
    cursor = span.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function updateField(email: EmailInput, field: 'sender' | 'subject' | 'body', event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): EmailInput {
  return { ...email, [field]: event.target.value };
}

export function EmailPane({ email, result, queue, selectedIndex, onSelect, onChange, onAnalyze, analyzing }: EmailPaneProps) {
  const indicators = result?.indicators ?? [];
  return (
    <section className="workspace-grid" aria-label="Email queue and investigation workspace">
      <aside className="queue-panel panel">
        <div className="section-heading"><span className="eyebrow">CASE QUEUE</span><span className="mono muted">{queue.length.toString().padStart(2, '0')} CASES</span></div>
        <div className="queue-list">
          {queue.map((item, index) => (
            <button className={`queue-item ${selectedIndex === index ? 'is-selected' : ''}`} key={item.label} onClick={() => onSelect(index)} aria-pressed={selectedIndex === index}>
              <span className="queue-item-top"><span className="queue-label">{item.label}</span><span className={`severity-text severity-${item.result.verdict}`}>{item.result.verdict}</span></span>
              <strong>{item.email.sender}</strong>
              <span className="queue-subject">{item.email.subject}</span>
              <span className="queue-item-bottom"><span className="preview">{item.email.body.slice(0, 58)}{item.email.body.length > 58 ? '…' : ''}</span><span className="mono score-small">{item.result.score}/100</span></span>
            </button>
          ))}
        </div>
      </aside>

      <div className="email-panel panel">
        <div className="section-heading"><span className="eyebrow">EMAIL ANALYSIS</span><span className="mono muted">{result ? 'ANALYSIS COMPLETE' : 'INPUT REQUIRED'}</span></div>
        {!result && (
          <div className="input-toolbar">
            <label className="control-label" htmlFor="demo-email">LOAD DEMO CASE
              <select id="demo-email" value={selectedIndex ?? ''} onChange={(event) => event.target.value !== '' && onSelect(Number(event.target.value))}>
                <option value="">Choose a curated email</option>
                {queue.map((item, index) => <option value={index} key={item.label}>{item.label}</option>)}
              </select>
            </label>
            <button className="button button-primary" onClick={onAnalyze} disabled={analyzing}>{analyzing ? 'ANALYZING…' : 'ANALYZE EMAIL'}</button>
          </div>
        )}
        <div className="email-meta">
          {result ? <div className="technical-field"><span>FROM</span><div className="technical-value">{highlightedText(email.sender, 'sender', indicators)}</div></div> : <label><span>FROM</span><input value={email.sender} onChange={(event) => onChange(updateField(email, 'sender', event))} aria-label="Sender" /></label>}
          {result ? <div className="technical-field"><span>SUBJECT</span><div className="technical-value">{highlightedText(email.subject, 'subject', indicators)}</div></div> : <label><span>SUBJECT</span><input value={email.subject} onChange={(event) => onChange(updateField(email, 'subject', event))} aria-label="Subject" /></label>}
          {result && <label><span>TIMESTAMP</span><span className="technical-value">{new Date(result.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></label>}
        </div>
        <div className="email-body-wrap">
          <span className="eyebrow">MESSAGE BODY</span>
          {result ? <div className="raw-email body-copy">{highlightedText(email.body, 'body', indicators)}</div> : <textarea className="raw-editor" value={email.body} onChange={(event) => onChange(updateField(email, 'body', event))} aria-label="Email body" rows={11} />}
        </div>
        <div className="email-assets">
          <div><span className="eyebrow">LINKS</span>{email.links.length ? email.links.map((link) => <a className="technical-link" href={link.href} target="_blank" rel="noreferrer" key={`${link.displayText}-${link.href}`}>{link.displayText}<span className="link-href">{highlightedText(link.href, 'url', indicators)}</span></a>) : <span className="muted">No links attached</span>}</div>
          <div><span className="eyebrow">ATTACHMENTS</span>{email.attachments.length ? email.attachments.map((attachment) => <span className="attachment-row" key={attachment.name}><span>↳ {attachment.name}</span><span className="mono muted">.{attachment.extension}</span></span>) : <span className="muted">No attachments</span>}</div>
        </div>
      </div>
    </section>
  );
}
