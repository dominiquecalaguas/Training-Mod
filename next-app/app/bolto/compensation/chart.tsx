"use client";

import { useId, useState, type ReactNode } from "react";
import { chartPeriods, equityValue, usd, type Compensation, type ChartPeriod } from "./model";
import styles from "./compensation.module.css";

const colors = { base: "#a9f6c3", equity: "#a3beff", bonus: "#f87a1a" };
const short = (n: number) => n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}m` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : `${+n.toFixed(1)}`;
const display = (value: number | null) => value === null ? "Not estimated" : usd(value);
const date = (time: number) => new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function CompensationChart({ data, assumptions }: { data: Compensation; assumptions: ReactNode }) {
  const id = useId().replaceAll(":", "");
  const periods = chartPeriods(data);
  const [hovered, setHovered] = useState<number | null>(null);
  const known = periods.some(p => p.base !== null || p.bonus !== null || p.equity !== null);
  const max = Math.max(0, ...periods.map(p => (p.base ?? 0) + (p.equity ?? 0) + (p.bonus ?? 0)));
  const ceiling = max ? Math.ceil(max * 1.12 / (10 ** Math.floor(Math.log10(max)) / 20)) * (10 ** Math.floor(Math.log10(max)) / 20) : 1;
  const placeholders = data.payType === "contract" ? 1 : 4;
  const count = periods.length || placeholders;
  const slot = 626 / count;
  const width = Math.min(89, slot * 0.57);
  const labelBase = data.payType === "contract" ? "Contract base" : "Salary";
  const active = hovered !== null ? periods[hovered] : null;

  function describe(p: ChartPeriod) {
    return `${p.label}. ${date(p.start)} to ${date(p.end - 86400000)}. ${labelBase}: ${display(p.base)}. Signing bonus: ${data.bonusIncluded ? display(p.bonus) : "Not included"}. Hypothetical equity: ${data.equityIncluded ? display(p.equity) : "Not included"}.`;
  }

  return <section className={styles.chartCard} aria-labelledby="chart-heading">
    <h2 id="chart-heading" className={styles.chartTitle}>Live compensation preview</h2>
    <ul className={styles.legend} aria-label="Chart legend">
      {([["base", labelBase], ["equity", "Equity estimate"], ["bonus", "Signing bonus"]] as const).map(([key, label]) => (
        <li key={key}><span style={{ background: periods.some(p => p[key] !== null) ? colors[key] : "#f4f4f1" }} />{label}</li>
      ))}
    </ul>
    <svg viewBox="0 0 800 606" className={styles.chartSvg} role="group" aria-label="Compensation by period in USD">
      <image href="/bolto/compensation/chart-grid.svg" x="70" y="166" width="698" height="321.5" />
      {known && [0, 1, 2, 3, 4].map(i => <text key={i} x="62" y={490 - i * 80} textAnchor="end" className={styles.axis}>{short(ceiling * i / 4)}</text>)}
      {Array.from({ length: count }, (_, index) => {
        const p = periods[index];
        const x = 120 + index * slot + (89 - width) / 2;
        const segments = p ? (["base", "equity", "bonus"] as const).filter(key => p[key] !== null && p[key]! > 0) : [];
        const total = segments.reduce((sum, key) => sum + (p[key] ?? 0), 0);
        let bottom = 486;
        const totalHeight = 320 * total / ceiling;
        return <g key={index} tabIndex={p && known ? 0 : undefined} role={p && known ? "img" : undefined}
          aria-label={p && known ? describe(p) : undefined}
          onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} className={styles.chartBar}>
          <defs><clipPath id={`${id}-${index}`}><rect x={x} y={486 - totalHeight} width={width} height={Math.max(0, totalHeight) + 8} rx="8" /></clipPath></defs>
          {!known ? <rect x={x} y="208" width={width} height="278" rx="8" fill="#f4f4f1" stroke="#d3d3d3" strokeDasharray="5 5" />
            : <g clipPath={`url(#${id}-${index})`}>{segments.map(key => {
              const height = 320 * p[key]! / ceiling;
              bottom -= height;
              return <rect key={key} x={x} y={bottom} width={width} height={height} fill={colors[key]} />;
            })}</g>}
          {p && known && <rect x={x} y={Math.min(484, 486 - totalHeight)} width={width} height={Math.max(2, totalHeight)} fill="transparent"><title>{describe(p)}</title></rect>}
          <text x={x + width / 2} y="534" textAnchor="middle" className={styles.periodLabel}>{p?.label ?? (data.payType === "contract" ? "Contract period" : `Year ${index + 1}`)}</text>
        </g>;
      })}
      {!known && <g className={styles.emptyChart} aria-label="Your compensation preview will appear here">
        <text x="419" y="350" textAnchor="middle">Your compensation preview will appear here</text>
        <text x="419" y="378" textAnchor="middle" className={styles.emptyCaption}>Add a base salary, bonus, or equity to get started.</text>
      </g>}
    </svg>
    {active && known && <div role="tooltip" className={styles.tooltip}>
      <strong>{active.label}</strong><span>{labelBase}: {display(active.base)}</span>
      <span>Signing bonus: {data.bonusIncluded ? display(active.bonus) : "Not included"}</span>
      <span>Hypothetical equity: {data.equityIncluded ? display(active.equity) : "Not included"}</span>
    </div>}
    <details className={styles.assumptions}>
      <summary>Chart assumptions{data.equityIncluded ? equityValue(data) === null ? " · equity unestimated" : " · includes hypothetical equity" : " · USD"}</summary>
      <div className={styles.assumptionsBody}>{assumptions}
        <p>Fictional chart start date; no legal grant date is implied. First paycheck is placed in the first period. Four years are shown for full-time offers.</p>
        <p>Contracts use the entered start and inclusive end dates. Hourly estimates use calendar days ÷ 7 × assumed weekly hours; fixed project fees are spread once across that duration.</p>
        <p>Hypothetical equity is not guaranteed compensation. Annual vesting is simplified to even accrual within each annual bucket; a contract ending sooner includes only that overlap. No renewals, cliffs, tax, dilution, or investment returns are assumed.</p>
      </div>
    </details>
  </section>;
}
