import { useState } from 'react'
import { CHAPTER_GROUPS, chapterNumber } from '../chapters'
import { applyThemePref, readThemePref, type ThemePref } from '../lib/theme'
import { Segmented } from './Controls'

interface SidebarProps {
  activeId: string
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ activeId, open, onNavigate }: SidebarProps) {
  const [theme, setTheme] = useState<ThemePref>(readThemePref)

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Daftar bab">
      <div className="brand">
        <span className="brand-title">LLM Visualization</span>
        <span className="brand-sub">Memahami LLM langkah demi langkah</span>
      </div>

      <nav>
        {CHAPTER_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div className="nav-group-label">{group.label}</div>
            <ul className="nav-list">
              {group.chapters.map((ch) => (
                <li key={ch.id}>
                  <a
                    href={`#/${ch.id}`}
                    className={`nav-item${ch.id === activeId ? ' active' : ''}`}
                    aria-current={ch.id === activeId ? 'page' : undefined}
                    title={ch.summary}
                    onClick={onNavigate}
                  >
                    <span className="nav-num">{String(chapterNumber(ch.id)).padStart(2, '0')}</span>
                    <span>{ch.title}</span>
                    {ch.status === 'planned' && <span className="nav-badge">segera</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-group-label" style={{ padding: 0 }}>
          Tema
        </div>
        <Segmented
          value={theme}
          options={[
            { value: 'system', label: 'Sistem' },
            { value: 'light', label: 'Terang' },
            { value: 'dark', label: 'Gelap' },
          ]}
          onChange={(v) => {
            setTheme(v)
            applyThemePref(v)
          }}
        />
      </div>
    </aside>
  )
}
