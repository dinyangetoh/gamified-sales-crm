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

  return (
    <button
      className={`btn ${ghost ? 'ghost' : ''} ${sm ? 'sm' : ''} ${className}`.trim()}
      style={style}
      {...props}
    />
  )
}

