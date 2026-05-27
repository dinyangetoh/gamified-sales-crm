import type { CSSProperties } from 'react'

const palette: Record<string, [string, string]> = {
  'lv-1': ['#dcdad3', '#3a3730'],
  'lv-2': ['#dde2f1', '#3b4c8c'],
  'lv-3': ['#e9defa', '#5d3d96'],
  'lv-4': ['#f1e2bc', '#7a5a14'],
  default: ['#e9e5d8', '#3a3730'],
}

export default function Avatar({
  name,
  initials,
  size = 28,
  tone,
  style,
}: {
  name: string
  initials: string
  size?: number
  tone?: string
  style?: CSSProperties
}) {
  const [bg, fg] = palette[tone ?? ''] || palette.default

  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </span>
  )
}

