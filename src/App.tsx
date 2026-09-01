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
  const [analyzing, setAnalyzing] = useState(false);
  const queue = useMemo(() => testEmails.map((item) => ({ ...item, result: runFullAnalysis(item.email) })), []);

  const analyze = (nextEmail = email) => {
    setAnalyzing(true);
    window.setTimeout(() => { setResult(runFullAnalysis(nextEmail)); setAnalyzing(false); }, 120);
  };
  const changeEmail = (nextEmail: EmailInput) => { setEmail(nextEmail); if (result) setResult(null); };
  const selectEmail = (index: number) => { const next = testEmails[index].email; setSelectedIndex(index); setEmail(next); setResult(null); analyze(next); };

  return <div className="app-shell">
    <header className="top-nav"><div className="brand-lockup"><span className="lens-mark" aria-hidden="true" /><div><strong>PHISHLENS</strong><span>PHISHING ANALYSIS ENGINE</span></div></div><nav aria-label="Primary"><a href="#analysis">Analysis</a><a href="#evidence">Evidence</a><a href="#how-it-works">How it works</a></nav><div className="engine-status"><span /> ENGINE ONLINE</div></header>
    <main id="analysis"><div className="page-intro"><div><span className="eyebrow">LOCAL INVESTIGATION WORKSPACE</span><h1>See why an email is suspicious.</h1></div><span className="mono case-count">CASE / EMAIL</span></div>
      {analyzing && <div className="analysis-state" role="status">ANALYZING SIGNALS <span className="loading-dots">•••</span></div>}
      {!result && !analyzing ? <div className="empty-state panel"><span className="lens-mark large" aria-hidden="true" /><h2>PHISHLENS</h2><p>Select an email to begin analysis.</p><span>Every verdict is backed by inspectable indicators.</span></div> : result && <div className="analysis-layout"><EmailPane email={email} result={result} queue={queue} selectedIndex={selectedIndex} onSelect={selectEmail} onChange={changeEmail} onAnalyze={() => analyze()} analyzing={analyzing} /><aside className="risk-column" id="evidence"><VerdictCard result={result} /><section className="why-panel panel"><div className="section-heading"><span className="eyebrow">WHY THIS EMAIL IS FLAGGED</span></div>{result.indicators.length ? result.indicators.map((item, index) => <div className="why-row" key={`${item.id}-${index}`}><span className="mono why-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><p>{item.evidence}</p></div></div>) : <p className="empty-panel">No suspicious indicators detected.</p>}</section><IndicatorList indicators={result.indicators} score={result.score} /></aside></div>}
      {!result && !analyzing && <EmailPane email={email} result={null} queue={queue} selectedIndex={selectedIndex} onSelect={selectEmail} onChange={changeEmail} onAnalyze={() => analyze()} analyzing={analyzing} />}
    </main>
  </div>;
}
