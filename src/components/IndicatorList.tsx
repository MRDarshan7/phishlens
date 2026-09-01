import type { Indicator, Severity } from '../types';

const severityOrder: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function IndicatorList({ indicators, score }: { indicators: Indicator[]; score: number }) {
  const sorted = [...indicators].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  return (
    <section className="indicator-panel panel" aria-labelledby="indicators-heading">
      <div className="section-heading"><span className="eyebrow" id="indicators-heading">DETECTED INDICATORS</span><span className="mono muted">{String(indicators.length).padStart(2, '0')} SIGNALS</span></div>
      {sorted.length ? <div className="indicator-list">{sorted.map((indicator) => <details className={`indicator-row indicator-border-${indicator.severity}`} key={`${indicator.id}-${indicator.evidence}`}><summary><span className={`severity-dot dot-${indicator.severity}`} /><span className="indicator-name">{indicator.name}</span><span className={`severity-text severity-${indicator.severity}`}>{indicator.severity}</span><span className="indicator-points mono">+{indicator.points}</span></summary><div className="indicator-detail"><p>{indicator.evidence}</p><span className="mono muted indicator-id">{indicator.id}{indicator.location ? ` · ${indicator.location.field}:${indicator.location.startIndex}–${indicator.location.endIndex}` : ''}</span></div></details>)}</div> : <p className="empty-panel">No indicators to inspect. The engine found no suspicious signals in this message.</p>}
      {sorted.length > 0 && <div className="score-breakdown"><div className="section-heading"><span className="eyebrow">WHY THE SCORE IS {score}</span><span className="mono muted">CONTRIBUTIONS</span></div>{sorted.map((indicator) => <div className="breakdown-row" key={`${indicator.id}-breakdown`}><span>+{indicator.points}</span><span>{indicator.name}</span></div>)}</div>}
    </section>
  );
}
