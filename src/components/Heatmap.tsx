import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DivergingScale } from '../lib/color'

interface HeatmapProps {
  /** Row-major values, length rows * cols. */
  data: ArrayLike<number>
  rows: number
  cols: number
  /** Values are divided by this before hitting the [-1, 1] colour scale. */
  vmax: number
  scale: DivergingScale
  height: number
  xLabel: string
  yLabel: string
  tooltip: (row: number, col: number) => ReactNode
  /** Highlighted row (outlined). */
  selectedRow?: number
  /** Highlighted columns (outlined). */
  selectedCols?: number[]
  onCellClick?: (row: number, col: number) => void
  /** Optional per-row labels drawn left of the plot (use for short row counts). */
  rowLabels?: string[]
  /** Colour for non-finite cells (e.g. masked entries). */
  nanRgb?: [number, number, number]
  ariaLabel: string
}

const DEFAULT_NAN: [number, number, number] = [128, 128, 128]

interface Hover {
  row: number
  col: number
  x: number
  y: number
  width: number
}

export function Heatmap({
  data,
  rows,
  cols,
  vmax,
  scale,
  height,
  xLabel,
  yLabel,
  tooltip,
  selectedRow,
  selectedCols,
  onCellClick,
  nanRgb = DEFAULT_NAN,
  rowLabels,
  ariaLabel,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(cols, rows)
    for (let i = 0; i < rows * cols; i++) {
      const [r, g, b] = Number.isFinite(data[i]) ? scale.rgb(data[i] / vmax) : nanRgb
      img.data[i * 4] = r
      img.data[i * 4 + 1] = g
      img.data[i * 4 + 2] = b
      img.data[i * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, [data, rows, cols, vmax, scale, nanRgb])

  const cellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - rect.left) / rect.width
    const fy = (e.clientY - rect.top) / rect.height
    const col = Math.min(cols - 1, Math.max(0, Math.floor(fx * cols)))
    const row = Math.min(rows - 1, Math.max(0, Math.floor(fy * rows)))
    const plotRect = plotRef.current!.getBoundingClientRect()
    return { row, col, x: e.clientX - plotRect.left, y: e.clientY - plotRect.top, width: plotRect.width }
  }

  const flip = hover ? hover.x > hover.width * 0.6 : false

  return (
    <div className="heatmap-wrap">
      {rowLabels ? (
        <div className="heatmap-rowlabels" style={{ height }} aria-hidden>
          {rowLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      ) : (
        <div className="heatmap-ylabel">{yLabel}</div>
      )}
      <div ref={plotRef} style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className="heatmap-canvas"
          style={{ height }}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={(e) => {
            setHover(cellFromEvent(e))
          }}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => {
            const c = cellFromEvent(e)
            onCellClick?.(c.row, c.col)
          }}
        />
        {selectedRow !== undefined && selectedRow < rows && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: -3,
              right: -3,
              top: `calc(${(selectedRow / rows) * 100}% - 2px)`,
              height: `calc(${100 / rows}% + 4px)`,
              minHeight: 5,
              border: '2px solid var(--text-primary)',
              borderRadius: 3,
              pointerEvents: 'none',
            }}
          />
        )}
        {selectedCols?.map((c) =>
          c < cols ? (
            <div
              key={c}
              aria-hidden
              style={{
                position: 'absolute',
                top: -3,
                bottom: -3,
                left: `calc(${(c / cols) * 100}% - 1px)`,
                width: `calc(${100 / cols}% + 2px)`,
                minWidth: 3,
                borderLeft: '1px dashed var(--text-secondary)',
                borderRight: '1px dashed var(--text-secondary)',
                pointerEvents: 'none',
              }}
            />
          ) : null,
        )}
        {hover && (
          <div
            className="tooltip"
            style={{
              left: flip ? undefined : hover.x + 14,
              right: flip ? hover.width - hover.x + 14 : undefined,
              top: hover.y + 14,
            }}
          >
            {tooltip(hover.row, hover.col)}
          </div>
        )}
        <div
          className="axis-label"
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}
        >
          <span>0</span>
          <span>{cols - 1}</span>
        </div>
      </div>
      <div className="heatmap-xlabel">{xLabel}</div>
    </div>
  )
}

interface ColorBarProps {
  scale: DivergingScale
  min: string
  max: string
  negativeOnly?: boolean
  positiveOnly?: boolean
}

export function ColorBar({ scale, min, max, negativeOnly = false, positiveOnly = false }: ColorBarProps) {
  return (
    <div className="colorbar">
      <span>{min}</span>
      <span className="colorbar-ramp" style={{ background: negativeOnly ? scale.gradientNeg : positiveOnly ? scale.gradientPos : scale.gradient }} />
      <span>{max}</span>
    </div>
  )
}
