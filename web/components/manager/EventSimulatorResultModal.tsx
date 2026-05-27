'use client'

import Modal from '@/components/ui/Modal'
import BadgeIcon from '@/components/ui/BadgeIcon'
import type { SimulatorModalState } from '@/lib/events/eventSimulatorTypes'

function statusLabel(state: SimulatorModalState) {
  if (state.kind === 'error') return 'Request failed'
  const r = state.result
  if (r.duplicate) return 'Duplicate event'
  if (r.capReached) return 'Accepted — daily cap reached'
  if (r.accepted) return 'Event accepted'
  return 'Not accepted'
}

function statusColor(state: SimulatorModalState) {
  if (state.kind === 'error') return 'var(--danger)'
  const r = state.result
  if (r.duplicate) return 'var(--warn)'
  if (r.capReached) return 'var(--warn)'
  if (r.accepted) return 'var(--success)'
  return 'var(--muted)'
}

export default function EventSimulatorResultModal({
  state,
  onClose,
}: {
  state: SimulatorModalState | null
  onClose: () => void
}) {
  if (!state) return null

  return (
    <Modal open title={statusLabel(state)} onClose={onClose}>
      {state.kind === 'error' ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>{state.message}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--bg-sub)',
              borderLeft: `3px solid ${statusColor(state)}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: statusColor(state) }}>{statusLabel(state)}</div>
            {state.result.reason && (
              <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-2)' }}>{state.result.reason}</div>
            )}
          </div>

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
            <dt style={{ color: 'var(--muted)' }}>Event ID</dt>
            <dd className="num" style={{ margin: 0, wordBreak: 'break-all' }}>
              {state.result.eventId}
            </dd>
            <dt style={{ color: 'var(--muted)' }}>Points</dt>
            <dd className="num" style={{ margin: 0, fontWeight: 600 }}>
              {state.result.pointsAwarded > 0 ? '+' : ''}
              {state.result.pointsAwarded}
            </dd>
            <dt style={{ color: 'var(--muted)' }}>Duplicate</dt>
            <dd style={{ margin: 0 }}>{state.result.duplicate ? 'Yes' : 'No'}</dd>
            <dt style={{ color: 'var(--muted)' }}>Cap reached</dt>
            <dd style={{ margin: 0 }}>{state.result.capReached ? 'Yes' : 'No'}</dd>
          </dl>

          {state.result.user && (
            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Updated profile
              </div>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 6, fontSize: 12.5 }}>
                <dt style={{ color: 'var(--muted)' }}>Level</dt>
                <dd style={{ margin: 0 }}>{state.result.user.levelLabel}</dd>
                <dt style={{ color: 'var(--muted)' }}>Total XP</dt>
                <dd className="num" style={{ margin: 0 }}>
                  {state.result.user.totalXP}
                </dd>
                <dt style={{ color: 'var(--muted)' }}>Week points</dt>
                <dd className="num" style={{ margin: 0 }}>
                  {state.result.user.totalPoints}
                </dd>
                <dt style={{ color: 'var(--muted)' }}>Streak</dt>
                <dd className="num" style={{ margin: 0 }}>
                  {state.result.user.currentStreak} (best {state.result.user.longestStreak})
                </dd>
              </dl>
            </div>
          )}

          {state.result.badgesUnlocked.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Badges unlocked
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.result.badgesUnlocked.map((b) => (
                  <div key={b.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BadgeIcon type={b.type} size={36} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{b.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
