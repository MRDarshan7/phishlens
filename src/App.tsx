import { useMemo, useState } from 'react';
import { EmailPane } from './components/EmailPane';
import { IndicatorList } from './components/IndicatorList';
import { VerdictCard } from './components/VerdictCard';
import { testEmails } from './data/testEmails';
import { runFullAnalysis } from './engine/scorer';
import type { AnalysisResult, EmailInput } from './types';

const emptyEmail: EmailInput = { sender: '', subject: '', body: '', links: [], attachments: [] };

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [email, setEmail] = useState<EmailInput>(emptyEmail);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [stale, setStale] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const queue = useMemo(() => testEmails.map((item) => ({ ...item, result: runFullAnalysis(item.email) })), []);
  const analyze = (nextEmail = email) => { setAnalyzing(true); window.setTimeout(() => { setResult(runFullAnalysis(nextEmail)); setStale(false); setAnalyzing(false); }, 120); };
  const changeEmail = (nextEmail: EmailInput) => { setEmail(nextEmail); if (result) { setResult(null); setStale(true); } };
  const selectEmail = (index: number) => { const next = testEmails[index].email; setSelectedIndex(index); setEmail(next); setResult(null); setStale(false); analyze(next); };
  const reasons = useMemo(() => {
    if (!result) return [];
    const seen = new Set<string>();
    return result.indicators.filter((indicator) => { const key = indicator.name.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
  }, [result]);

  return <div className="app-shell">
    <header className="top-nav"><div className="brand-lockup"><span className="lens-mark" aria-hidden="true" /><div><strong>PHISHLENS</strong><span>PHISHING ANALYSIS ENGINE</span></div></div><nav aria-label="Primary"><a href="#analysis">Analysis</a><a href="#evidence">Evidence</a></nav><div className="engine-status"><span /> ENGINE ONLINE</div></header>
    <main id="analysis"><div className="page-intro"><div><span className="eyebrow">LOCAL INVESTIGATION WORKSPACE</span><h1>See why an email is suspicious.</h1></div><span className="mono case-count">CASE / EMAIL</span></div>
      {analyzing && <div className="analysis-state" role="status">ANALYZING SIGNALS <span className="loading-dots">•••</span></div>}
      <div className="analysis-layout"><EmailPane email={email} result={result} stale={stale} queue={queue} selectedIndex={selectedIndex} onSelect={selectEmail} onChange={changeEmail} onAnalyze={() => analyze()} analyzing={analyzing} />
        {result ? <aside className="risk-column" id="evidence"><VerdictCard result={result} /><section className="why-panel panel"><div className="section-heading"><span className="eyebrow">WHY THIS EMAIL IS FLAGGED</span><span className="mono muted">{String(reasons.length).padStart(2, '0')} REASONS</span></div>{reasons.length ? reasons.map((item, index) => <div className="why-row" key={item.name}><span className="mono why-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><p>{item.evidence}</p></div></div>) : <p className="empty-panel">No suspicious indicators detected.</p>}</section><IndicatorList indicators={result.indicators} score={result.score} /></aside> : <aside className="risk-column empty-risk panel" aria-label="Risk summary awaiting analysis"><span className="eyebrow">RISK / EVIDENCE</span><p>Select a case or analyze a manual email to inspect engine output.</p></aside>}
      </div>
    </main>
  </div>;
}
