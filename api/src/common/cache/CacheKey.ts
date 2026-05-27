export const CacheKey = {
  leaderboard: (isoWeek: string) => `leaderboard:${isoWeek}`,
  leaderboardAllTime: () => 'leaderboard:all-time',
  scoringConfig: () => 'scoring-config',
  dedup: (provider: string, eventId: string) => `dedup:${provider}:${eventId}`,
} as const
