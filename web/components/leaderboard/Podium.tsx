'use client'

import Avatar from '@/components/ui/Avatar'
import BadgeIcon from '@/components/ui/BadgeIcon'
import RankDelta from '@/components/ui/RankDelta'
import Streak from '@/components/ui/Streak'
import Crown from '@/components/charts/Crown'
import Medal from '@/components/charts/Medal'
import { initialsFromName, levelTone } from '@/components/ui/Icon'

export type PodiumEntry = {
  userId: string
  name: string
  rank: number
  weekPoints: number
  level: number
  levelLabel: string
  currentStreak: number
  rankDelta?: number
  lastWeekRank?: number
  badges?: Array<{ type: string }>
  activity?: number
}

export default function Podium({ entries, currentUserId }: { entries: PodiumEntry[]; currentUserId?: string }) {
  const top3 = entries.slice(0, 3)
  if (top3.length < 3) return null

  const order = [top3[1], top3[0], top3[2]]

  return (
    <div className="card" style={{ padding: '24px 24px 28px', marginBottom: 14, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
            Week standings
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>The podium</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 18, alignItems: 'end' }}>
        {order.map((r) => {
          const isFirst = r.rank === 1
          const isSecond = r.rank === 2
          const isMe = r.userId === currentUserId
          const lift = isFirst ? 0 : isSecond ? 18 : 30
          const delta = r.rankDelta ?? (r.lastWeekRank != null ? r.lastWeekRank - r.rank : undefined)

          return (
            <div key={r.userId} style={{ position: 'relative', transform: `translateY(${lift}px)` }}>
              {isFirst && (
                <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }}>
                  <Crown size={36} color="#b88420" />
                </div>
              )}
              <div
                style={{
                  background: isFirst ? 'var(--lv4-soft)' : 'var(--surface-2)',
                  border: isFirst ? '1px solid #ead7ad' : '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '20px 18px 16px',
                  outline: isMe ? '2px solid var(--ink)' : 'none',
                  outlineOffset: -1,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <Medal rank={r.rank} size={isFirst ? 50 : 42} />
                </div>
                <Avatar name={r.name} initials={initialsFromName(r.name)} size={isFirst ? 60 : 52} tone={levelTone(r.level)} />
                <div style={{ fontSize: isFirst ? 16 : 14, fontWeight: 600, marginTop: 10 }}>
                  {r.name}
                  {isMe && <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>you</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {r.levelLabel}
                  {r.activity != null ? ` · ${r.activity} events` : ''}
                </div>
                <div style={{ marginTop: 14, padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                    <span className="num" style={{ fontSize: isFirst ? 30 : 24, fontWeight: 600, color: isFirst ? 'var(--lv4)' : 'var(--ink)' }}>
                      {r.weekPoints}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                    <RankDelta delta={delta} />
                    {r.currentStreak >= 3 && <Streak days={r.currentStreak} />}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                  {(r.badges ?? []).slice(0, 4).map((b) => (
                    <BadgeIcon key={b.type} type={b.type} size={20} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
