import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

interface TexProps {
  children: string
  block?: boolean
}

/** Renders a LaTeX string with KaTeX. Input is authored in this repo, never user-supplied. */
export function Tex({ children, block = false }: TexProps) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: 'ignore' }),
    [children, block],
  )
  if (block) return <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
