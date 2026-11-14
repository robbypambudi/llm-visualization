import type { ReactNode } from 'react'

interface SliderProps {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps) {
  return (
    <label className="control">
      <span className="control-label">
        <span>{label}</span>
        <span className="control-value">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

interface SegmentedProps<T extends string | number> {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  ariaLabel?: string
}

export function Segmented<T extends string | number>({ value, options, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface FieldProps {
  label: ReactNode
  children: ReactNode
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="control control-fit">
      <span className="control-label">
        <span>{label}</span>
      </span>
      {children}
    </div>
  )
}
