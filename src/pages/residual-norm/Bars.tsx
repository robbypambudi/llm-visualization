import { useState, type ReactNode } from 'react'
import { useWidth } from '../../lib/useWidth'

const M = { top: 8, right: 8, bottom: 22, left: 36 }

interface BarsProps {
  values: number[]
  /** Symmetric y-range: bars are drawn on [−vmax, vmax]. */
  vmax: number
  color: string
  height?: number
  tooltip: (i: number) => ReactNode
  ariaLabel: string
}

/** Vertical bars around a zero baseline, one per feature, with a hover tooltip. */
export function Bars({ values, vmax, color, height = 160, tooltip, ariaLabel }: BarsProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const innerW = Math.max(0, width - M.left - M.right)
  const innerH = height - M.top - M.bottom
  const n = values.length
  const slot = innerW / n
  const barW = Math.max(4, Math.min(28, slot - 6))
  const sy = (v: number) => M.top + (1 - (Math.max(-vmax, Math.min(vmax, v)) + vmax) / (2 * vmax)) * innerH
  const ticks = [-vmax, -vmax / 2, 0, vmax / 2, vmax]
  const cx = (i: number) => M.left + slot * (i + 0.5)
  const flip = hover !== null && cx(hover) > width * 0.6

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} />
              <text x={M.left - 6} y={sy(t)} dy="0.32em" textAnchor="end" className="axis-label">
                {Number(t.toFixed(2))}
              </text>
            </g>
          ))}
          {values.map((v, i) => {
            const y0 = sy(0)
            const y1 = sy(v)
            return (
              <g key={i}>
                <rect
                  x={cx(i) - barW / 2}
                  y={Math.min(y0, y1)}
                  width={barW}
                  height={Math.max(1, Math.abs(y1 - y0))}
                  rx={3}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
                <text x={cx(i)} y={height - 6} textAnchor="middle" className="axis-label">
                  {i + 1}
                </text>
                <rect
                  x={cx(i) - slot / 2}
                  y={M.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            )
          })}
        </svg>
      )}
      {hover !== null && (
        <div
          className="tooltip"
          style={{
            top: M.top,
            left: flip ? undefined : cx(hover) + 12,
            right: flip ? width - cx(hover) + 12 : undefined,
          }}
        >
          {tooltip(hover)}
        </div>
      )}
    </div>
  )
}
