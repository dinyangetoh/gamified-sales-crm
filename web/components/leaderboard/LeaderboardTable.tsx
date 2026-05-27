'use client'

import type { ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import BadgeIcon from '@/components/ui/BadgeIcon'
import LevelChip from '@/components/ui/LevelChip'
import RankDelta from '@/components/ui/RankDelta'
import Streak from '@/components/ui/Streak'
import { Icon, initialsFromName, levelTone } from '@/components/ui/Icon'
import type { PodiumEntry } from '@/components/leaderboard/Podium'

export default function LeaderboardTable({
  entries,
  currentUserId,
  showWeekPoints = true,
  includePodium = false,
}: {
  entries: PodiumEntry[]
  currentUserId?: string
  showWeekPoints?: boolean
  /** When true, list all entries (e.g. all-time); default skips top 3 for weekly table below podium */
  includePodium?: boolean
}) {
  const rest = includePodium ? entries : entries.slice(3)

  return (
    <CardTable>
      {rest.map((r) => {
        const isMe = r.userId === currentUserId
        const delta = r.rankDelta ?? (r.lastWeekRank != null ? r.lastWeekRank - r.rank : undefined)
        return (
          <div
            key={r.userId}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1.4fr 100px 90px 80px 1fr',
              gap: 10,
              padding: '12px 18px',
              alignItems: 'center',
              borderBottom: '1px solid var(--divider)',
              background: isMe ? 'var(--bg-sub)' : 'transparent',
            }}
          >
            <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              {r.rank}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar name={r.name} initials={initialsFromName(r.name)} size={28} tone={levelTone(r.level)} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {r.name}
                  {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--muted)' }}>you</span>}
                </div>
              </div>
            </div>
            <LevelChip level={r.level} label={r.levelLabel} size="sm" />
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
              <RankDelta delta={delta} />
              <div style={{ display: 'flex', gap: 3 }}>
                {(r.badges ?? []).slice(0, 3).map((b) => (
                  <BadgeIcon key={b.type} type={b.type} size={18} />
                ))}
              </div>
              <span style={{ color: 'var(--muted)', display: 'inline-flex' }}>{Icon.chev}</span>
            </div>
          </div>
        )
      })}
    </CardTable>
  )
}

function CardTable({ children }: { children: ReactNode }) {
  return (
    <section className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 1.4fr 100px 90px 80px 1fr',
          gap: 10,
          padding: '10px 18px',
          borderBottom: '1px solid var(--divider)',
          fontSize: 10.5,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        <div>Rank</div>
        <div>Rep</div>
        <div>Level</div>
        <div style={{ textAlign: 'right' }}>Pts</div>
        <div style={{ textAlign: 'center' }}>Streak</div>
        <div />
      </div>
      {children}
    </section>
  )
}
