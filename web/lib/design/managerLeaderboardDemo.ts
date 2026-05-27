export type LeaderboardDetail = {
  email: string
  activity: number
  calls: number
  meetings: number
  stages: number
  wins: number
  eventMix: { v: number; c: string }[]
}

const MIX_COLORS = ['#6c7280', '#4a63b8', '#7a4fbe', '#3a8f63', '#b94a3b'] as const

const BY_NAME: Record<string, LeaderboardDetail> = {
  'alice smith': {
    email: 'alice@demo.com',
    activity: 24,
    calls: 14,
    meetings: 8,
    stages: 5,
    wins: 3,
    eventMix: [14, 8, 5, 3, 1].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'diana osei': {
    email: 'diana@demo.com',
    activity: 21,
    calls: 12,
    meetings: 9,
    stages: 3,
    wins: 2,
    eventMix: [12, 9, 3, 2, 1].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'bob tanaka': {
    email: 'bob@demo.com',
    activity: 18,
    calls: 8,
    meetings: 6,
    stages: 7,
    wins: 1,
    eventMix: [8, 6, 7, 1, 0].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'charlie reyes': {
    email: 'charlie@demo.com',
    activity: 14,
    calls: 10,
    meetings: 3,
    stages: 2,
    wins: 1,
    eventMix: [10, 3, 2, 1, 0].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'evan park': {
    email: 'evan@demo.com',
    activity: 12,
    calls: 8,
    meetings: 2,
    stages: 2,
    wins: 1,
    eventMix: [8, 2, 2, 1, 1].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'fiona walsh': {
    email: 'fiona@demo.com',
    activity: 11,
    calls: 7,
    meetings: 2,
    stages: 4,
    wins: 1,
    eventMix: [7, 2, 4, 1, 0].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'george nakamura': {
    email: 'george@demo.com',
    activity: 22,
    calls: 18,
    meetings: 1,
    stages: 1,
    wins: 0,
    eventMix: [18, 1, 1, 0, 2].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
  'hannah lee': {
    email: 'hannah@demo.com',
    activity: 0,
    calls: 0,
    meetings: 0,
    stages: 0,
    wins: 0,
    eventMix: [0, 0, 0, 0, 0].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  },
}

export function getLeaderboardDetail(name: string): LeaderboardDetail {
  const fallback: LeaderboardDetail = {
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@demo.com`,
    activity: 0,
    calls: 0,
    meetings: 0,
    stages: 0,
    wins: 0,
    eventMix: [0, 0, 0, 0, 0].map((v, i) => ({ v, c: MIX_COLORS[i] })),
  }
  return BY_NAME[name.toLowerCase()] ?? fallback
}
