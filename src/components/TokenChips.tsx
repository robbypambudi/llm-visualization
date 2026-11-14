import { isPartialByte, visibleToken, type Tokenizer } from '../lib/tokenizer'

interface Props {
  ids: number[]
  tok: Tokenizer
  showIds?: boolean
  /** Ids drawn with a highlight (e.g. special tokens). */
  highlight?: (id: number) => boolean
}

export function TokenChips({ ids, tok, showIds = false, highlight }: Props) {
  if (!ids.length) return <span className="muted-text">(kosong)</span>
  return (
    <div className="tok-chips">
      {ids.map((id, i) => {
        const text = tok.decode([id])
        const partial = isPartialByte(text)
        return (
          <span
            key={i}
            className={`tok${highlight?.(id) ? ' tok-special' : ''}`}
            title={partial ? `ID ${id} · potongan byte dari satu karakter` : `ID ${id}`}
          >
            <span className="tok-text">{partial ? '‹byte›' : visibleToken(text)}</span>
            {showIds && <span className="tok-id">{id}</span>}
          </span>
        )
      })}
    </div>
  )
}

/** Plain string pieces (for the toy tokenizers that have no ids). */
export function PieceChips({ pieces, unknown }: { pieces: string[]; unknown?: (p: string) => boolean }) {
  if (!pieces.length) return <span className="muted-text">(kosong)</span>
  return (
    <div className="tok-chips">
      {pieces.map((p, i) => (
        <span key={i} className={`tok${unknown?.(p) ? ' tok-unknown' : ''}`}>
          <span className="tok-text">{visibleToken(p)}</span>
        </span>
      ))}
    </div>
  )
}
