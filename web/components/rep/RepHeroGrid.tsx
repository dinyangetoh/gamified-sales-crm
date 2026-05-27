'use client'

import Card from '@/components/ui/Card'
import LevelChip from '@/components/ui/LevelChip'
import RankDelta from '@/components/ui/RankDelta'
import Streak from '@/components/ui/Streak'
import Crown from '@/components/charts/Crown'
import Sparkline from '@/components/charts/Sparkline'
import { Icon } from '@/components/ui/Icon'
import { MY_STREAK_DAYS, MY_WEEK_PTS } from '@/lib/design/repDemo'

type LevelConfig = { level: number; minXP: number; label: string }

export default function RepHeroGrid({
  name,
  totalXP,
  level,
  levelLabel,
  levelConfigs,
  rank,
  rankedCount,
  rankDelta,
  pointsGap,
  behindName,
  behindGap,
  weekPoints,
  currentStreak,
  longestStreak,
}: {
  name: string
  totalXP: number
  level: number
  levelLabel: string
  levelConfigs: LevelConfig[]
  rank: number
  rankedCount: number
  rankDelta?: number
  pointsGap: number
  behindName?: string
  behindGap?: number
  weekPoints: number
  currentStreak: number
  longestStreak: number
}) {
  const nextLevel = levelConfigs.find((l) => l.level === level + 1)
  const xpFloor = levelConfigs.find((l) => l.level === level)?.minXP ?? 0
  const xpInLevel = totalXP - xpFloor
  const xpToNext = nextLevel ? nextLevel.minXP - totalXP : 0
  const xpSpan = nextLevel ? nextLevel.minXP - xpFloor : Math.max(totalXP - xpFloor, 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
              Experience · all time
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span className="num" style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {totalXP}
              </span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>XP</span>
            </div>
          </div>
          <LevelChip level={level} label={levelLabel} />
        </div>
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
            <span>
              <span className="num" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                {xpInLevel}
              </span>{' '}
              / {xpSpan} XP in tier
            </span>
            {nextLevel ? (
              <span>
                <span className="num" style={{ color: 'var(--lv4)', fontWeight: 600 }}>
                  {xpToNext}
                </span>{' '}
                XP to {nextLevel.label}
              </span>
            ) : (
              <span style={{ color: 'var(--lv4)', fontWeight: 600 }}>Top tier reached</span>
            )}
          </div>
          <div style={{ height: 10, background: 'var(--bg-sub)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                right: `${100 - (xpInLevel / xpSpan) * 100}%`,
                background: 'var(--lv4)',
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {levelConfigs.map((l) => {
              const reached = l.level <= level
              return (
                <div key={l.level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: reached ? 1 : 0.45, gap: 3 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: reached ? `var(--lv${l.level})` : 'var(--bg-sub)',
                      color: reached ? '#fff' : 'var(--muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  >
                    {reached ? '✓' : l.level}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ink-2)', fontWeight: 500 }}>{l.label}</span>
                  <span className="num" style={{ fontSize: 9.5, color: 'var(--muted)' }}>
                    {l.minXP}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card padded={false}>
        <div style={{ padding: '18px 20px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                Rank
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                {rank === 1 && <Crown size={20} />}
                <span className="num" style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  #{rank}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>of {rankedCount}</span>
              </div>
            </div>
            <RankDelta delta={rankDelta} />
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--lv4-soft)', borderRadius: 8, border: '1px solid #ead7ad' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
              {rank === 1 ? "You're leading." : `${pointsGap} pts behind the leader.`}
            </div>
            {behindName && behindGap != null && (
              <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600, marginTop: 3 }}>
                {behindName} is <span className="num">{behindGap}</span> pts behind you
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 20px 16px', borderTop: '1px solid var(--divider)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Points · last 7 days
            </span>
            <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>
              +{weekPoints}
            </span>
          </div>
          <Sparkline data={MY_WEEK_PTS} width={260} height={36} color="var(--lv4)" fill="var(--lv4-soft)" />
        </div>
      </Card>

      <Card padded={false}>
        <div style={{ padding: '18px 20px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                Current streak
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ color: 'var(--flame)', display: 'inline-flex' }}>{Icon.flame}</span>
                <span className="num" style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {currentStreak}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>days</span>
              </div>
            </div>
            <span className="chip" style={{ background: 'var(--flame-soft)', color: 'var(--flame)' }}>
              Personal best <span className="num">{longestStreak}</span>
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Last 14 days</span>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {MY_STREAK_DAYS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 22,
                    borderRadius: 4,
                    background: d.active ? 'var(--flame)' : 'var(--bg-sub)',
                    border: d.today ? '1.5px solid var(--ink)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {d.active && (
                    <span style={{ color: '#fff', display: 'inline-flex', transform: 'scale(0.7)' }}>{Icon.flame}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
