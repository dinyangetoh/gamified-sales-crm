import type { CSSProperties, ReactNode } from 'react'

export default function Chip({
  children,
  style,
  className = '',
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <span className={`chip ${className}`.trim()} style={style}>
      {children}
    </span>
  )
}

