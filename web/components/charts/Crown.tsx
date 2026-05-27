export default function Crown({ size = 18, color = '#b88420' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 28 20" fill="none">
      <path
        d="M2 6 L7 14 L14 3 L21 14 L26 6 L24 18 L4 18 Z"
        fill={color}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="2" cy="5" r="1.8" fill={color} />
      <circle cx="14" cy="2" r="1.8" fill={color} />
      <circle cx="26" cy="5" r="1.8" fill={color} />
    </svg>
  )
}
