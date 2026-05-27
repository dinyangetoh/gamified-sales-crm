import { mock, MockProxy } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'
import { EventType, BadgeType, Role } from '@prisma/client'
import { getQueueToken } from '@nestjs/bullmq'
import { ScoringEventProcessor } from '../../../src/modules/scoring/ScoringEventProcessor'
import { CreateEventInput } from '../../../src/modules/scoring/types/eventResult.types'
import { ScoringRepository } from '../../../src/modules/scoring/repositories/ScoringRepository'
import { ScoringConfigService } from '../../../src/modules/scoring/ScoringConfigService'
import { BadgesService } from '../../../src/modules/badges/BadgesService'
import { UsersService } from '../../../src/modules/users/UsersService'
import { DeduplicationService } from '../../../src/common/cache/DeduplicationService'
import { ICacheAdapter, CACHE_ADAPTER } from '../../../src/common/cache/ICacheAdapter'
import { QueueName } from '../../../src/common/queues/QueueName'
import type { TxClient } from '../../../src/common/prisma/types'

const LEVELS = [
  { level: 1, minXP: 0, label: 'Rookie', updatedAt: new Date() },
  { level: 2, minXP: 100, label: 'Closer', updatedAt: new Date() },
  { level: 3, minXP: 250, label: 'Elite', updatedAt: new Date() },
  { level: 4, minXP: 500, label: 'Legend', updatedAt: new Date() },
]

function makeUser(id = 'user-1') {
  return { id, email: 'test@test.com', name: 'Test', role: Role.SALES_REP, passwordHash: 'x', createdAt: new Date(), updatedAt: new Date() }
}

function makeStats(overrides: Partial<{ totalXP: number; totalPoints: number; level: number; currentStreak: number; longestStreak: number }> = {}) {
  return {
    id: 'stats-1',
    userId: 'user-1',
    totalXP: 0,
    totalPoints: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeConfig() {
  return {
    pointRules: {
      LEAD_CONTACTED: 10,
      MEETING_COMPLETED: 20,
      STAGE_ADVANCED: 30,
      DEAL_WON: 100,
      DEAL_LOST: -20,
    },
    dailyCaps: {
      LEAD_CONTACTED: { maxCount: 5, isActive: true },
    },
    levels: LEVELS.map((l) => ({ level: l.level, minXP: l.minXP, label: l.label })),
  }
}

describe('ScoringEventProcessor', () => {
  let processor: ScoringEventProcessor
  let scoringRepo: MockProxy<ScoringRepository>
  let scoringConfigService: MockProxy<ScoringConfigService>
  let badgesService: MockProxy<BadgesService>
  let usersService: MockProxy<UsersService>
  let dedup: MockProxy<DeduplicationService>
  let cache: MockProxy<ICacheAdapter>
  let notificationQueue: { add: jest.Mock }

  const baseInput: CreateEventInput = {
    eventId: 'evt-001',
    userId: 'user-1',
    eventType: EventType.DEAL_WON,
    entityId: 'deal-1',
    timestamp: new Date().toISOString(),
  }

  beforeEach(async () => {
    scoringRepo = mock<ScoringRepository>()
    scoringConfigService = mock<ScoringConfigService>()
    badgesService = mock<BadgesService>()
    usersService = mock<UsersService>()
    dedup = mock<DeduplicationService>()
    cache = mock<ICacheAdapter>()
    notificationQueue = { add: jest.fn().mockResolvedValue(undefined) }

    scoringRepo.runTransaction.mockImplementation(async (fn: (tx: TxClient) => Promise<unknown>) =>
      fn({} as TxClient),
    )
    scoringRepo.createEvent.mockResolvedValue({} as never)
    scoringRepo.upsertUserStats.mockResolvedValue(makeStats())
    scoringRepo.upsertWeeklyStat.mockResolvedValue({} as never)
    scoringRepo.upsertDailyCap.mockResolvedValue({} as never)
    scoringRepo.createTimelineEntry.mockResolvedValue({} as never)
    scoringRepo.findDailyCap.mockResolvedValue(null)

    usersService.findOrThrow.mockResolvedValue(makeUser())
    usersService.getStats.mockResolvedValue(makeStats())
    dedup.isProcessed.mockResolvedValue(false)
    badgesService.evaluate.mockResolvedValue({ unlocked: [] })
    scoringConfigService.getConfig.mockResolvedValue(makeConfig())
    cache.del.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ScoringEventProcessor,
        { provide: ScoringRepository, useValue: scoringRepo },
        { provide: ScoringConfigService, useValue: scoringConfigService },
        { provide: BadgesService, useValue: badgesService },
        { provide: UsersService, useValue: usersService },
        { provide: DeduplicationService, useValue: dedup },
        { provide: CACHE_ADAPTER, useValue: cache },
        { provide: getQueueToken(QueueName.NOTIFICATION), useValue: notificationQueue },
      ],
    }).compile()

    processor = module.get(ScoringEventProcessor)
  })

  describe('duplicate detection', () => {
    it('returns duplicate:true and pointsAwarded:0 for duplicate event', async () => {
      dedup.isProcessed.mockResolvedValue(true)
      const result = await processor.processEvent(baseInput)
      expect(result.duplicate).toBe(true)
      expect(result.pointsAwarded).toBe(0)
      expect(result.accepted).toBe(true)
    })

    it('does not call the transaction for duplicates', async () => {
      dedup.isProcessed.mockResolvedValue(true)
      await processor.processEvent(baseInput)
      expect(scoringRepo.runTransaction).not.toHaveBeenCalled()
    })
  })

  describe('point calculation', () => {
    it('awards 100 points for DEAL_WON', async () => {
      const result = await processor.processEvent({ ...baseInput, eventType: EventType.DEAL_WON })
      expect(result.pointsAwarded).toBe(100)
    })

    it('awards 20 points for MEETING_COMPLETED', async () => {
      const result = await processor.processEvent({ ...baseInput, eventType: EventType.MEETING_COMPLETED })
      expect(result.pointsAwarded).toBe(20)
    })

    it('XP floor is 0 — never negative even with DEAL_LOST on 0 XP', async () => {
      usersService.getStats.mockResolvedValue(makeStats({ totalXP: 0, totalPoints: 0 }))
      scoringRepo.upsertUserStats.mockResolvedValue(makeStats({ totalXP: 0, totalPoints: 0 }))
      const result = await processor.processEvent({ ...baseInput, eventType: EventType.DEAL_LOST })
      expect(result.user?.totalXP).toBe(0)
      expect(result.user?.totalPoints).toBe(0)
    })
  })

  describe('daily cap', () => {
    it('sets capReached:true and pointsAwarded:0 when cap count is at max', async () => {
      scoringRepo.findDailyCap.mockResolvedValue({
        id: 'cap-1', userId: 'user-1', eventType: EventType.LEAD_CONTACTED, date: new Date(), count: 5,
      } as never)
      const result = await processor.processEvent({ ...baseInput, eventType: EventType.LEAD_CONTACTED })
      expect(result.capReached).toBe(true)
      expect(result.pointsAwarded).toBe(0)
      expect(result.reason).toBe('Daily cap reached for LEAD_CONTACTED (5/5)')
    })
  })

  describe('badge unlocks', () => {
    it('includes unlocked badges in response', async () => {
      badgesService.evaluate.mockResolvedValue({ unlocked: [BadgeType.FIRST_WIN] })
      scoringRepo.upsertUserStats.mockResolvedValue(makeStats({ totalXP: 100, totalPoints: 100, level: 2 }))
      const result = await processor.processEvent(baseInput)
      expect(result.badgesUnlocked).toHaveLength(1)
      expect(result.badgesUnlocked[0].type).toBe(BadgeType.FIRST_WIN)
    })
  })
})
