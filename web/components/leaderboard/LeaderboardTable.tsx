'use client'

import type { ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import BadgeIcon from '@/components/ui/BadgeIcon'
import LevelChip from '@/components/ui/LevelChip'
import RankDelta from '@/components/ui/RankDelta'
import Streak from '@/components/ui/Streak'
import { Icon, initialsFromName, levelTone } from '@/components/ui/Icon'
import StackedBar from '@/components/charts/StackedBar'
import Medal from '@/components/charts/Medal'
import type { PodiumEntry } from '@/components/leaderboard/Podium'

export default function LeaderboardTable({
  entries,
  currentUserId,
  showWeekPoints = true,
  showDelta = true,
  includePodium = false,
  detailed = false,
}: {
  entries: PodiumEntry[]
  currentUserId?: string
  showWeekPoints?: boolean
  showDelta?: boolean
  /** When true, list all entries (e.g. all-time); default skips top 3 for weekly table below podium */
  includePodium?: boolean
  detailed?: boolean
}) {
  const rest = includePodium ? entries : entries.slice(3)
  const maxActivity = Math.max(...rest.map((r) => r.activity ?? 0), 1)
  const grid = detailed ? '44px 1.5fr 110px 65px 65px 65px 65px 150px 80px 80px' : '48px 1.4fr 100px 90px 80px 1fr'

  return (
    <CardTable detailed={detailed}>
      {rest.map((r) => {
        const isMe = r.userId === currentUserId
        const delta = r.rankDelta ?? (r.lastWeekRank != null ? r.lastWeekRank - r.rank : undefined)
        return (
          <div
            key={r.userId}
            style={{
              display: 'grid',
              gridTemplateColumns: grid,
              gap: 8,
              padding: '12px 18px',
              alignItems: 'center',
              borderBottom: '1px solid var(--divider)',
              background: isMe ? 'var(--bg-sub)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {r.rank <= 3 ? (
                <Medal rank={r.rank} size={24} />
              ) : (
                <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
                  {r.rank}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar name={r.name} initials={initialsFromName(r.name)} size={28} tone={levelTone(r.level)} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {r.name}
                  {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--muted)' }}>you</span>}
                </div>
                {detailed && r.email && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{r.email}</div>
                )}
              </div>
            </div>
            <LevelChip level={r.level} label={r.levelLabel} size="sm" />
            {detailed ? (
              <>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-2)' }} className="num">{r.calls ?? '—'}</div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-2)' }} className="num">{r.meetings ?? '—'}</div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-2)' }} className="num">{r.stages ?? '—'}</div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: 12,
                    fontWeight: 600,
                    color: (r.wins ?? 0) > 0 ? 'var(--success)' : 'var(--muted-2)',
                  }}
                  className="num"
                >
                  {r.wins ?? '—'}
                </div>
                <div>
                  <StackedBar segments={r.eventMix ?? []} max={maxActivity} width={140} height={7} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>{showDelta && <RankDelta delta={delta} />}</div>
                <div style={{ textAlign: 'right' }} className="num">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{r.weekPoints}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'right' }} className="num">
                  {showWeekPoints ? (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.weekPoints}</span>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{r.weekPoints}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Streak days={r.currentStreak} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                  {showDelta && <RankDelta delta={delta} />}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {(r.badges ?? []).slice(0, 3).map((b, idx) => (
                      <BadgeIcon key={`${r.userId}-${b.type}-${idx}`} type={b.type} size={18} />
                    ))}
                  </div>
                  <span style={{ color: 'var(--muted)', display: 'inline-flex' }}>{Icon.chev}</span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </CardTable>
  )
}

function CardTable({ children, detailed }: { children: ReactNode; detailed?: boolean }) {
  return (
    <section className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: detailed ? '44px 1.5fr 110px 65px 65px 65px 65px 150px 80px 80px' : '48px 1.4fr 100px 90px 80px 1fr',
          gap: 8,
          padding: '10px 18px',
          borderBottom: '1px solid var(--divider)',
          fontSize: 10.5,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        {detailed ? (
          <>
            <div>#</div>
            <div>Rep</div>
            <div>Level</div>
            <div style={{ textAlign: 'right' }}>Calls</div>
            <div style={{ textAlign: 'right' }}>Mtgs</div>
            <div style={{ textAlign: 'right' }}>Stages</div>
            <div style={{ textAlign: 'right' }}>Wins</div>
            <div>Event mix</div>
            <div style={{ textAlign: 'center' }}>Δ rank</div>
            <div style={{ textAlign: 'right' }}>Points</div>
          </>
        ) : (
          <>
            <div>Rank</div>
            <div>Rep</div>
            <div>Level</div>
            <div style={{ textAlign: 'right' }}>Pts</div>
            <div style={{ textAlign: 'center' }}>Streak</div>
            <div />
          </>
        )}
      </div>
      {children}
    </section>
  )
}
