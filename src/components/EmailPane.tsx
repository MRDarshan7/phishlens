import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { AnalysisResult, EmailAttachment, EmailInput, EmailLink, Indicator, Severity } from '../types';

const severityOrder: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
type HighlightField = 'sender' | 'subject' | 'body' | 'url';

interface EmailPaneProps {
  email: EmailInput;
  result: AnalysisResult | null;
  stale: boolean;
  queue: { label: string; email: EmailInput; result: AnalysisResult }[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onChange: (email: EmailInput) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

function highlightedText(text: string, field: HighlightField, indicators: Indicator[]): ReactNode {
  const spans = indicators
    .filter((indicator) => indicator.location?.field === field && indicator.location)
    .map((indicator) => ({ indicator, start: indicator.location!.startIndex, end: indicator.location!.endIndex }))
    .filter(({ start, end }) => start >= 0 && end > start && end <= text.length)
    .sort((a, b) => a.start - b.start || severityOrder[b.indicator.severity] - severityOrder[a.indicator.severity]);
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const span of spans) {
    // Overlaps are resolved by severity order; lower-priority spans remain in the indicator list.
    if (span.start < cursor) continue;
    if (span.start > cursor) parts.push(text.slice(cursor, span.start));
    parts.push(<span className={`evidence-highlight evidence-${span.indicator.severity}`} tabIndex={0} title={span.indicator.evidence} key={`${span.indicator.id}-${span.start}`}>
      {text.slice(span.start, span.end)}<span className="evidence-popover" role="tooltip">{span.indicator.evidence}</span>
    </span>);
    cursor = span.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function fieldChange(email: EmailInput, field: 'sender' | 'subject' | 'body', event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): EmailInput {
  return { ...email, [field]: event.target.value };
}

export function EmailPane({ email, result, stale, queue, selectedIndex, onSelect, onChange, onAnalyze, analyzing }: EmailPaneProps) {
  const [editing, setEditing] = useState(false);
  const indicators = result?.indicators ?? [];
  const editMode = !result || editing;
  const updateLink = (index: number, field: keyof EmailLink, value: string) => onChange({ ...email, links: email.links.map((link, i) => i === index ? { ...link, [field]: value } : link) });
  const updateAttachment = (index: number, field: keyof EmailAttachment, value: string) => onChange({ ...email, attachments: email.attachments.map((item, i) => i === index ? { ...item, [field]: value } : item) });
  return (
    <section className="workspace-grid" aria-label="Email queue and investigation workspace">
      <aside className="queue-panel panel">
        <div className="section-heading"><span className="eyebrow">CASE QUEUE</span><span className="mono muted">{String(queue.length).padStart(2, '0')} CASES</span></div>
        <div className="queue-list">{queue.map((item, index) => <button className={`queue-item ${selectedIndex === index ? 'is-selected' : ''}`} key={item.label} onClick={() => onSelect(index)} aria-pressed={selectedIndex === index}>
          <span className="queue-item-top"><span className="queue-label">{item.label}</span><span className={`severity-text severity-${item.result.verdict}`}>{item.result.verdict}</span></span><strong>{item.email.sender}</strong><span className="queue-subject">{item.email.subject}</span><span className="queue-item-bottom"><span className="preview">{item.email.body.slice(0, 58)}{item.email.body.length > 58 ? '…' : ''}</span><span className="mono score-small">{item.result.score}/100</span></span>
        </button>)}</div>
      </aside>
      <div className="email-panel panel">
        <div className="section-heading"><span className="eyebrow">EMAIL ANALYSIS</span><span className={`mono ${stale ? 'stale-text' : 'muted'}`}>{result ? 'ANALYSIS COMPLETE' : stale ? 'ANALYSIS STALE' : 'NEW / MANUAL ANALYSIS'}</span>{result && !editing && <button className="add-button edit-button" onClick={() => setEditing(true)} aria-label="Edit analyzed email">EDIT EMAIL</button>}</div>
        {!result && !stale && <div className="inline-empty-state"><strong>SELECT A CASE TO BEGIN</strong><span>Choose a demo case or start a manual analysis below.</span></div>}
        {stale && <div className="stale-banner" role="status"><strong>ANALYSIS STALE</strong><span>Changes detected — analyze again to refresh the engine result.</span></div>}
        {editMode && <div className="input-toolbar"><label className="control-label" htmlFor="demo-email">LOAD DEMO CASE<select id="demo-email" value={selectedIndex ?? ''} onChange={(event) => event.target.value !== '' && onSelect(Number(event.target.value))}><option value="">Choose a curated email</option>{queue.map((item, index) => <option value={index} key={item.label}>{item.label}</option>)}</select></label><button className="button button-primary" onClick={onAnalyze} disabled={analyzing} aria-label="Analyze email">{analyzing ? 'ANALYZING…' : 'ANALYZE EMAIL'}</button></div>}
        <div className="email-meta">
          {!editMode ? <div className="technical-field"><span>FROM</span><div className="technical-value">{highlightedText(email.sender, 'sender', indicators)}</div></div> : <label><span>FROM</span><input value={email.sender} onChange={(event) => onChange(fieldChange(email, 'sender', event))} aria-label="Sender" /></label>}
          {!editMode ? <div className="technical-field"><span>SUBJECT</span><div className="technical-value">{highlightedText(email.subject, 'subject', indicators)}</div></div> : <label><span>SUBJECT</span><input value={email.subject} onChange={(event) => onChange(fieldChange(email, 'subject', event))} aria-label="Subject" /></label>}
          {result && <label><span>TIMESTAMP</span><span className="technical-value">{new Date(result.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></label>}
        </div>
        <div className="email-body-wrap"><span className="eyebrow">MESSAGE BODY</span>{editMode ? <textarea className="raw-editor" value={email.body} onChange={(event) => onChange(fieldChange(email, 'body', event))} aria-label="Email body" rows={9} /> : <div className="raw-email body-copy">{highlightedText(email.body, 'body', indicators)}</div>}</div>
        <div className="email-assets">
          <div><span className="eyebrow">LINKS</span>{!editMode ? (email.links.length ? email.links.map((link) => <div className="structured-link" key={`${link.displayText}-${link.href}`}><span className="asset-label">DISPLAYED AS</span><span>{link.displayText}</span><span className="asset-label">DESTINATION</span><span className="technical-link-value">{highlightedText(link.href, 'url', indicators)}</span></div>) : <span className="muted">No links attached</span>) : <>{email.links.map((link, index) => <div className="asset-editor" key={`link-${index}`}><input value={link.displayText} onChange={(event) => updateLink(index, 'displayText', event.target.value)} aria-label={`Link ${index + 1} display text`} placeholder="Display text" /><input value={link.href} onChange={(event) => updateLink(index, 'href', event.target.value)} aria-label={`Link ${index + 1} href`} placeholder="https://destination" /><button className="icon-button" onClick={() => onChange({ ...email, links: email.links.filter((_, i) => i !== index) })} aria-label={`Remove link ${index + 1}`}>×</button></div>)}<button className="add-button" onClick={() => onChange({ ...email, links: [...email.links, { displayText: '', href: '' }] })} aria-label="Add link">+ ADD LINK</button></>}</div>
          <div><span className="eyebrow">ATTACHMENTS</span>{!editMode ? (email.attachments.length ? email.attachments.map((item) => <span className="attachment-row" key={item.name}><span>↳ {item.name}</span><span className="mono muted">.{item.extension}</span></span>) : <span className="muted">No attachments</span>) : <>{email.attachments.map((item, index) => <div className="asset-editor" key={`attachment-${index}`}><input value={item.name} onChange={(event) => updateAttachment(index, 'name', event.target.value)} aria-label={`Attachment ${index + 1} name`} placeholder="Filename" /><input value={item.extension} onChange={(event) => updateAttachment(index, 'extension', event.target.value)} aria-label={`Attachment ${index + 1} extension`} placeholder="Extension" /><button className="icon-button" onClick={() => onChange({ ...email, attachments: email.attachments.filter((_, i) => i !== index) })} aria-label={`Remove attachment ${index + 1}`}>×</button></div>)}<button className="add-button" onClick={() => onChange({ ...email, attachments: [...email.attachments, { name: '', extension: '' }] })} aria-label="Add attachment">+ ADD ATTACHMENT</button></>}</div>
        </div>
      </div>
    </section>
  );
}
