'use client'

export default function NudgeButton({ onNudge }: { onNudge: () => void }) {
  return (
    <button
      type="button"
      className="btn ghost sm"
      onClick={onNudge}
      style={{ height: 22, padding: '0 8px', fontSize: 10.5 }}
    >
      Nudge
    </button>
  )
}
