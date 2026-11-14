import { useEffect, useMemo, useState } from 'react'
import { hexToRgb, makeDivergingScale } from './color'

export type ThemePref = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'llmviz.theme'

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

export function applyThemePref(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    /* storage unavailable */
  }
}

/** Bumps whenever the effective theme can have changed (OS setting or data-theme toggle). */
function useThemeVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', bump)
    const mo = new MutationObserver(bump)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq.removeEventListener('change', bump)
      mo.disconnect()
    }
  }, [])
  return version
}

/** Reads the CSS custom properties that canvas-drawn charts need. */
export function useChartTheme() {
  const version = useThemeVersion()
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const v = (name: string) => cs.getPropertyValue(name).trim()
    const diverging = makeDivergingScale(v('--div-neg'), v('--div-mid'), v('--div-pos'))
    return {
      version,
      diverging,
      series: [v('--series-1'), v('--series-2'), v('--series-3')],
      surface: v('--surface-1'),
      surface2Rgb: hexToRgb(v('--surface-2')),
      textPrimary: v('--text-primary'),
      accent: v('--accent'),
    }
  }, [version])
}

export type ChartTheme = ReturnType<typeof useChartTheme>
