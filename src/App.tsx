import { useEffect, useState } from 'react'
import { ALL_CHAPTERS, DEFAULT_CHAPTER_ID } from './chapters'
import { Sidebar } from './components/Sidebar'
import { applyThemePref, readThemePref, useChartTheme } from './lib/theme'
import { ComingSoon } from './pages/ComingSoon'
import { PositionalEncodingPage } from './pages/positional-encoding/PositionalEncodingPage'
import { TokenEmbeddingPage } from './pages/token-embedding/TokenEmbeddingPage'
import { TokenizationPage } from './pages/tokenization/TokenizationPage'

function readRoute(): string {
  const id = window.location.hash.replace(/^#\/?/, '')
  return ALL_CHAPTERS.some((c) => c.id === id) ? id : DEFAULT_CHAPTER_ID
}

applyThemePref(readThemePref())

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [menuOpen, setMenuOpen] = useState(false)
  const theme = useChartTheme()

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const chapter = ALL_CHAPTERS.find((c) => c.id === route)!

  useEffect(() => {
    document.title = `${chapter.title} · LLM Visualization`
  }, [chapter])

  return (
    <div className="app">
      <Sidebar activeId={route} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && (
        <div
          aria-hidden
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 30 }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <div className="mobile-bar">
          <button type="button" className="btn" onClick={() => setMenuOpen(true)} aria-label="Buka daftar bab">
            ☰
          </button>
          <strong>{chapter.title}</strong>
        </div>
        <main className="main">
          {chapter.id === 'tokenization' ? (
            <TokenizationPage />
          ) : chapter.id === 'token-embedding' ? (
            <TokenEmbeddingPage theme={theme} />
          ) : chapter.id === 'positional-encoding' ? (
            <PositionalEncodingPage theme={theme} />
          ) : (
            <ComingSoon chapter={chapter} />
          )}
        </main>
      </div>
    </div>
  )
}
