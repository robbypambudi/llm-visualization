import { useId } from 'react'

export type BlockPart = 'stream' | 'ln' | 'attn' | 'add' | 'mlp'

const W = 320
const H = 400
const STREAM_X = 56
const BOX_X = 118
const BOX_W = 184
const MID_X = BOX_X + BOX_W / 2

interface BoxSpec {
  part: BlockPart
  href: string
  y: number
  h: number
  title: string
  sub?: string
}

const BOXES: BoxSpec[] = [
  { part: 'ln', href: '#/residual-norm', y: 66, h: 28, title: 'LayerNorm' },
  { part: 'attn', href: '#/self-attention', y: 108, h: 48, title: 'Self-Attention', sub: 'multi-head · causal' },
  { part: 'ln', href: '#/residual-norm', y: 216, h: 28, title: 'LayerNorm' },
  { part: 'mlp', href: '#/feed-forward', y: 258, h: 48, title: 'Feed-Forward (MLP)', sub: 'per token' },
]

const ADDS = [176, 326]

/**
 * One GPT-2-style (Pre-LN) block, drawn top to bottom: the residual stream runs down the left, and each
 * sub-layer branches off it, reads a normalised copy, and adds its result back.
 */
export function BlockMap({ highlight, caption }: { highlight: BlockPart[]; caption?: string }) {
  const uid = useId().replace(/:/g, '')
  const arrow = `bm-arrow-${uid}`
  const streamArrow = `bm-stream-${uid}`
  const on = (p: BlockPart) => (highlight.includes(p) ? ' bm-on' : '')
  return (
    <figure className="block-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Diagram satu blok Transformer gaya GPT-2">
        <defs>
          <marker id={arrow} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="bm-arrowhead" />
          </marker>
          <marker id={streamArrow} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className={`bm-stream-head${on('stream')}`} />
          </marker>
        </defs>
        <text x={STREAM_X - 16} y={16} className="bm-io">
          masuk: satu vektor per token
        </text>
        <line x1={STREAM_X} x2={STREAM_X} y1={26} y2={360} className={`bm-stream${on('stream')}`} markerEnd={`url(#${streamArrow})`} />
        <text
          x={STREAM_X - 14}
          y={250}
          textAnchor="middle"
          transform={`rotate(-90 ${STREAM_X - 14} 250)`}
          className={`bm-stream-label${on('stream')}`}
        >
          jalur residual
        </text>
        {[0, 1].map((k) => {
          const tap = k === 0 ? 46 : 196
          const ln = BOXES[k * 2]
          const sub = BOXES[k * 2 + 1]
          return (
            <g key={k} className="bm-wire">
              <path d={`M${STREAM_X},${tap} H${MID_X} V${ln.y - 2}`} markerEnd={`url(#${arrow})`} />
              <path d={`M${MID_X},${ln.y + ln.h} V${sub.y - 2}`} markerEnd={`url(#${arrow})`} />
              <path d={`M${MID_X},${sub.y + sub.h} V${ADDS[k]} H${STREAM_X + 12}`} markerEnd={`url(#${arrow})`} />
            </g>
          )
        })}
        {BOXES.map((b, i) => (
          <a key={i} href={b.href} className={`bm-box${on(b.part)}`}>
            <rect x={BOX_X} y={b.y} width={BOX_W} height={b.h} rx={8} />
            <text x={MID_X} y={b.y + (b.sub ? 20 : 18)} textAnchor="middle" className="bm-title">
              {b.title}
            </text>
            {b.sub && (
              <text x={MID_X} y={b.y + 37} textAnchor="middle" className="bm-sub">
                {b.sub}
              </text>
            )}
          </a>
        ))}
        {ADDS.map((y) => (
          <a key={y} href="#/residual-norm" className={`bm-add${on('add')}`}>
            <circle cx={STREAM_X} cy={y} r={11} />
            <text x={STREAM_X} y={y + 5} textAnchor="middle">
              +
            </text>
          </a>
        ))}
        <text x={STREAM_X - 16} y={392} className="bm-io">
          keluar: ke blok berikutnya
        </text>
      </svg>
      {caption && <figcaption className="card-sub">{caption}</figcaption>}
    </figure>
  )
}
