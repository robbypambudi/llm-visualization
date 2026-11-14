import type { ReactNode } from 'react'

/** One-line summary at the end of a section, for readers who skim. */
export function Takeaway({ children }: { children: ReactNode }) {
  return (
    <p className="takeaway">
      <span className="takeaway-label">Intinya</span>
      {children}
    </p>
  )
}

/** Collapsible box for the math a beginner can skip without losing the thread. */
export function Deep({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <details className="deep">
      <summary>{title}</summary>
      <div className="deep-body">{children}</div>
    </details>
  )
}
