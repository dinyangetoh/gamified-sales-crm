import type { CSSProperties, ButtonHTMLAttributes } from 'react'

export default function Button({
  variant = 'solid',
  size = 'md',
  style,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost'
  size?: 'sm' | 'md'
}) {
  const ghost = variant === 'ghost'
  const sm = size === 'sm'

  const variantStyle: CSSProperties = ghost
    ? { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--border-strong)' }
    : { background: 'var(--accent)', color: '#f2f2f2', borderColor: 'var(--accent)' }

  return (
    <button
      className={`btn ${ghost ? 'ghost' : ''} ${sm ? 'sm' : ''} ${className}`.trim()}
      style={{ ...variantStyle, ...style }}
      {...props}
    />
  )
}

