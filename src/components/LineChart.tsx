import { useState, type ReactNode } from 'react'
import { useWidth } from '../lib/useWidth'

export interface LineSeries {
  name: string
  color: string
  /** Continuous function of x; sampled across the domain. */
  fn: (x: number) => number
  dashed?: boolean
}

interface LineChartProps {
  series: LineSeries[]
  xDomain: [number, number]
  yDomain: [number, number]
  height?: number
  xLabel: string
  yTicks?: number[]
  /** Draw a dot at every integer x (tokens live on integer positions). */
  integerMarkers?: boolean
  /** Vertical reference line(s). */
  xMarks?: { x: number; label: string }[]
  formatY?: (v: number) => string
  /** Extra tooltip content for the hovered integer x. */
  tooltipExtra?: (x: number) => ReactNode
  ariaLabel: string
}

const M = { top: 10, right: 12, bottom: 30, left: 44 }

function niceTicks(a: number, b: number, count = 6): number[] {
  const span = b - a
  if (span <= 0) return [a]
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(Number(v.toFixed(10)))
  return out
}

export function LineChart({
  series,
  xDomain,
  yDomain,
  height = 240,
  xLabel,
  yTicks,
  integerMarkers = false,
  xMarks,
  formatY = (v) => v.toFixed(3),
  tooltipExtra,
  ariaLabel,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hoverX, setHoverX] = useState<number | null>(null)

  const innerW = Math.max(0, width - M.left - M.right)
  const innerH = height - M.top - M.bottom
  const [x0, x1] = xDomain
  const [y0, y1] = yDomain
  const sx = (x: number) => M.left + ((x - x0) / (x1 - x0 || 1)) * innerW
  const sy = (y: number) => M.top + (1 - (y - y0) / (y1 - y0 || 1)) * innerH

  const samples = Math.max(2, Math.min(2000, Math.round(innerW * 1.5)))
  const paths =
    innerW <= 0
      ? []
      : series.map((s) => {
          // Non-finite values leave a gap (e.g. a curve that is still being drawn).
          let d = ''
          let pen = false
          for (let i = 0; i <= samples; i++) {
            const x = x0 + ((x1 - x0) * i) / samples
            const v = s.fn(x)
            if (!Number.isFinite(v)) {
              pen = false
              continue
            }
            const y = Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), v))
            d += `${pen ? 'L' : 'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`
            pen = true
          }
          return d
        })

  const xTicks = niceTicks(x0, x1, Math.max(2, Math.floor(innerW / 70)))
  const yt = yTicks ?? niceTicks(y0, y1, 4)
  const showMarkers = integerMarkers && x1 - x0 <= 64

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - rect.left) / rect.width
    const x = Math.round(x0 + fx * (x1 - x0))
    setHoverX(Math.min(x1, Math.max(x0, x)))
  }

  const flip = hoverX !== null && sx(hoverX) > width * 0.6

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {yt.map((t) => (
            <g key={`y${t}`}>
              <line x1={M.left} x2={width - M.right} y1={sy(t)} y2={sy(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="axis-label">
                {t}
              </text>
            </g>
          ))}
          {y0 < 0 && y1 > 0 && (
            <line x1={M.left} x2={width - M.right} y1={sy(0)} y2={sy(0)} stroke="var(--axis)" strokeWidth={1} />
          )}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={sx(t)} y={height - M.bottom + 16} textAnchor="middle" className="axis-label">
              {t}
            </text>
          ))}
          <text x={M.left + innerW / 2} y={height - 2} textAnchor="middle" className="axis-label">
            {xLabel}
          </text>
          {xMarks?.map((m) => (
            <g key={m.label}>
              <line
                x1={sx(m.x)}
                x2={sx(m.x)}
                y1={M.top}
                y2={M.top + innerH}
                stroke="var(--text-muted)"
                strokeDasharray="3 3"
              />
              <text x={sx(m.x) + 4} y={M.top + 10} className="axis-label">
                {m.label}
              </text>
            </g>
          ))}
          {paths.map((d, i) => (
            <path
              key={series[i].name}
              d={d}
              fill="none"
              stroke={series[i].color}
              strokeWidth={2}
              strokeDasharray={series[i].dashed ? '5 4' : undefined}
              strokeLinejoin="round"
            />
          ))}
          {showMarkers &&
            series.map((s) =>
              Array.from({ length: x1 - x0 + 1 }, (_, k) => x0 + k).map((x) => (
                <circle
                  key={`${s.name}-${x}`}
                  cx={sx(x)}
                  cy={sy(s.fn(x))}
                  r={3}
                  fill={s.color}
                  stroke="var(--surface-1)"
                  strokeWidth={1.5}
                />
              )),
            )}
          {hoverX !== null && (
            <g pointerEvents="none">
              <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.top} y2={M.top + innerH} stroke="var(--text-muted)" />
              {series.filter((s) => Number.isFinite(s.fn(hoverX))).map((s) => (
                <circle
                  key={s.name}
                  cx={sx(hoverX)}
                  cy={sy(s.fn(hoverX))}
                  r={4.5}
                  fill={s.color}
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
          <rect
            x={M.left}
            y={M.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHoverX(null)}
          />
        </svg>
      )}
      {hoverX !== null && (
        <div
          className="tooltip"
          style={{
            top: M.top,
            left: flip ? undefined : sx(hoverX) + 12,
            right: flip ? width - sx(hoverX) + 12 : undefined,
          }}
        >
          <div className="muted">
            {xLabel} = <span className="mono">{hoverX}</span>
          </div>
          {series.map((s) => (
            <div key={s.name} className="tt-row">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="legend-line" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="mono">{Number.isFinite(s.fn(hoverX)) ? formatY(s.fn(hoverX)) : '—'}</span>
            </div>
          ))}
          {tooltipExtra?.(hoverX)}
        </div>
      )}
    </div>
  )
}

export function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.name} className="legend-item">
          <span
            className="legend-line"
            style={{
              background: it.dashed
                ? `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 7px)`
                : it.color,
            }}
          />
          {it.name}
        </span>
      ))}
    </div>
  )
}
