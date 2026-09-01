import { useEffect, useState } from 'react';
import type { AnalysisResult, Severity } from '../types';

const colors: Record<Severity, string> = { low: '#4ade80', medium: '#fbbf24', high: '#fb4b5b', critical: '#ef233c' };

export function VerdictCard({ result }: { result: AnalysisResult }) {
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setDisplayScore(result.score); return; }
    let frame = 0;
    const started = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / 520);
      setDisplayScore(Math.round(result.score * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [result.score]);
  const circumference = 2 * Math.PI * 52;
  return (
    <section className={`verdict-card panel severity-border-${result.verdict}`} aria-label="Risk summary">
      <div className="section-heading"><span className="eyebrow">RISK SCORE</span><span className="mono muted">ENGINE OUTPUT</span></div>
      <div className="score-instrument" style={{ '--score-color': colors[result.verdict], '--dash': `${(result.score / 100) * circumference}px` } as React.CSSProperties}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="score-track" cx="60" cy="60" r="52" /><circle className="score-progress" cx="60" cy="60" r="52" /></svg>
        <div className="score-number"><strong>{displayScore}</strong><span>/ 100</span></div>
      </div>
      <div className="verdict-summary"><span className={`verdict-badge verdict-${result.verdict}`}>{result.verdict.toUpperCase()}</span>{result.indicators.length === 0 ? <p className="clean-message">NO SUSPICIOUS INDICATORS DETECTED</p> : <p className={`evidence-badge evidence-strength-${result.evidenceStrength}`}>{result.evidenceStrength === 'strong' ? 'STRONG EVIDENCE' : 'NEEDS HUMAN REVIEW'}</p>}</div>
    </section>
  );
}
