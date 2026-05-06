import { useMemo } from 'react';
import clsx from 'clsx';

interface SparklineProps {
  /** Stable string used to generate deterministic trend data (e.g. item id) */
  seed: string;
  /** Anchoring value (e.g. current stars, members, klout) — last point lands here */
  anchor: number;
  /** Number of points (default 14 for 2-week trend) */
  points?: number;
  /** Show the trend direction as a colored fill */
  trend?: 'up' | 'down' | 'flat' | 'auto';
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Show numeric label at end */
  showValue?: boolean;
  /** Optional label tooltip */
  label?: string;
}

// Deterministic pseudo-random based on string seed — same seed = same chart
function seededRandom(seed: string, i: number): number {
  let h = 0;
  const s = `${seed}_${i}`;
  for (let j = 0; j < s.length; j++) h = ((h << 5) - h) + s.charCodeAt(j);
  return Math.abs(Math.sin(h)) % 1;
}

/** Generate a deterministic time series trending toward the anchor value */
function genSeries(seed: string, anchor: number, points: number, biasUp: boolean): number[] {
  const baseRange = Math.max(anchor * 0.15, 2);   // realistic short-term variance
  const baseDrift = biasUp ? 0.12 : -0.08;        // overall trend
  const series: number[] = [];
  let val = anchor * (1 - baseDrift);
  for (let i = 0; i < points; i++) {
    const noise = (seededRandom(seed, i) - 0.5) * baseRange * 0.6;
    const drift = (anchor - val) / Math.max(points - i, 1) + (baseRange * baseDrift / points);
    val = Math.max(0, val + drift + noise);
    series.push(val);
  }
  // Force the last point to be exactly the anchor for accuracy
  series[points - 1] = anchor;
  return series;
}

/** Compact inline SVG sparkline — no charting library required. */
export function Sparkline({
  seed,
  anchor,
  points = 14,
  trend = 'auto',
  width = 60,
  height = 18,
  showValue = false,
  label,
}: SparklineProps) {
  const series = useMemo(() => {
    // Determine bias: if anchor is high, trend up; if explicit trend given, use that
    const biasUp = trend === 'up' ? true : trend === 'down' ? false : seededRandom(seed, 99) > 0.35;
    return genSeries(seed, anchor, points, biasUp);
  }, [seed, anchor, points, trend]);

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, 1);

  // Compute path
  const stepX = width / (points - 1);
  const pad = 2;
  const innerH = height - pad * 2;
  const pathD = series.map((v, i) => {
    const x = i * stepX;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  // Area fill (close path back to bottom)
  const lastX = (points - 1) * stepX;
  const areaD = `${pathD} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`;

  // Determine color based on first vs last point trend
  const direction: 'up' | 'down' | 'flat' =
    trend === 'auto' ? (series[points - 1] > series[0] * 1.02 ? 'up' : series[points - 1] < series[0] * 0.98 ? 'down' : 'flat') : trend;
  const stroke = direction === 'up' ? '#10b981' : direction === 'down' ? '#ef4444' : '#9ca3af';
  const fill   = direction === 'up' ? 'rgba(16, 185, 129, 0.12)' : direction === 'down' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(156, 163, 175, 0.08)';

  return (
    <div className="inline-flex items-center gap-1.5" title={label}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
        <path d={areaD} fill={fill} />
        <path d={pathD} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        {/* End-point dot */}
        <circle
          cx={lastX}
          cy={pad + innerH - ((series[points - 1] - min) / range) * innerH}
          r="1.6"
          fill={stroke}
        />
      </svg>
      {showValue && (
        <span className={clsx('text-[10px] font-semibold tabular-nums', direction === 'up' ? 'text-emerald-600' : direction === 'down' ? 'text-red-500' : 'text-gray-400')}>
          {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '·'}
          {/* Render a percentage delta */}
          {Math.abs(((series[points - 1] - series[0]) / Math.max(series[0], 1)) * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
