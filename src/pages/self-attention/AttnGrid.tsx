import type { Mat } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

interface AttnGridProps {
  weights: Mat
  tokens: string[]
  theme: ChartTheme
  selectedRow?: number
  onSelectRow?: (row: number) => void
  ariaLabel: string
}

/** Small word-labelled attention matrix: row = the token that asks, column = the token being looked at. */
export function AttnGrid({ weights, tokens, theme, selectedRow, onSelectRow, ariaLabel }: AttnGridProps) {
  const n = tokens.length
  return (
    <div className="attn-grid-scroll">
      <div
        className="attn-grid"
        role="table"
        aria-label={ariaLabel}
        style={{ gridTemplateColumns: `auto repeat(${n}, minmax(38px, 1fr))` }}
      >
        <span className="attn-corner" role="columnheader">
          bertanya ↓ · dilihat →
        </span>
        {tokens.map((t, j) => (
          <span key={j} className="attn-col" role="columnheader">
            {t}
          </span>
        ))}
        {weights.map((row, i) => (
          <div
            key={i}
            role="row"
            className={`attn-row${selectedRow === i ? ' attn-row-on' : ''}`}
            style={{ display: 'contents' }}
            onClick={() => onSelectRow?.(i)}
          >
            <span className="attn-rowlabel" role="rowheader">
              {tokens[i]}
            </span>
            {row.map((w, j) => (
              <span
                key={j}
                role="cell"
                className="attn-cell"
                style={{ background: Number.isFinite(w) ? theme.diverging.css(w) : 'var(--surface-2)' }}
                title={`“${tokens[i]}” melihat “${tokens[j]}”: ${Number.isFinite(w) ? fmt(w, 3) : '—'}`}
              >
                {Number.isFinite(w) ? fmt(w, 2).replace(/^0\./, '.') : '—'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
