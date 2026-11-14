import { chapterNumber, type Chapter } from '../chapters'

export function ComingSoon({ chapter }: { chapter: Chapter }) {
  return (
    <article className="page coming-soon">
      <div className="eyebrow">BAB {String(chapterNumber(chapter.id)).padStart(2, '0')}</div>
      <h1 style={{ fontSize: 34, margin: '6px 0 12px' }}>{chapter.title}</h1>
      <p className="lede">{chapter.summary}</p>
      <div className="callout">
        Bab ini belum dibuat. Mulai dari <a href="#/positional-encoding">Positional Encoding</a>.
      </div>
    </article>
  )
}
