import { mock, mockDeep, MockProxy, DeepMockProxy } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'
import { EventType, BadgeType, Role } from '@prisma/client'
import { getQueueToken } from '@nestjs/bullmq'
import { ScoringService, CreateEventInput } from '../../../src/modules/scoring/ScoringService'
import { PrismaService } from '../../../src/common/prisma/PrismaService'
import { BadgesService } from '../../../src/modules/badges/BadgesService'
import { UsersService } from '../../../src/modules/users/UsersService'
import { DeduplicationService } from '../../../src/common/cache/DeduplicationService'
import { ICacheAdapter, CACHE_ADAPTER } from '../../../src/common/cache/ICacheAdapter'
import { QueueName } from '../../../src/common/queues/QueueName'

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

describe('ScoringService', () => {
  let service: ScoringService
  let prisma: DeepMockProxy<PrismaService>
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

  function makeTxMock(statsOverride = makeStats()) {
    return {
      event: { create: jest.fn().mockResolvedValue({}) },
      userStats: { upsert: jest.fn().mockResolvedValue(statsOverride) },
      weeklyStat: { upsert: jest.fn().mockResolvedValue({}) },
      dailyCap: { upsert: jest.fn().mockResolvedValue({}) },
      awardTimeline: { create: jest.fn().mockResolvedValue({}) },
    }
  }

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>()
    badgesService = mock<BadgesService>()
    usersService = mock<UsersService>()
    dedup = mock<DeduplicationService>()
    cache = mock<ICacheAdapter>()
    notificationQueue = { add: jest.fn().mockResolvedValue(undefined) }

    const txMock = makeTxMock()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
    prisma.dailyCap.findUnique.mockResolvedValue(null)
    prisma.scoringRule.findMany.mockResolvedValue([])
    prisma.levelConfig.findMany.mockResolvedValue(LEVELS)
    prisma.dailyCapConfig.findMany.mockResolvedValue([
      { id: 'c1', eventType: EventType.LEAD_CONTACTED, maxCount: 5, isActive: true, updatedAt: new Date() },
    ])

    usersService.findOrThrow.mockResolvedValue(makeUser())
    usersService.getStats.mockResolvedValue(makeStats())
    dedup.isProcessed.mockResolvedValue(false)
    badgesService.evaluate.mockResolvedValue({ unlocked: [] })
    cache.get.mockResolvedValue(makeConfig())
    cache.set.mockResolvedValue(undefined)
    cache.del.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: PrismaService, useValue: prisma },
        { provide: BadgesService, useValue: badgesService },
        { provide: UsersService, useValue: usersService },
        { provide: DeduplicationService, useValue: dedup },
        { provide: CACHE_ADAPTER, useValue: cache },
        { provide: getQueueToken(QueueName.NOTIFICATION), useValue: notificationQueue },
      ],
    }).compile()

    service = module.get(ScoringService)
  })

  describe('duplicate detection', () => {
    it('returns duplicate:true and pointsAwarded:0 for duplicate event', async () => {
      dedup.isProcessed.mockResolvedValue(true)
      const result = await service.processEvent(baseInput)
      expect(result.duplicate).toBe(true)
      expect(result.pointsAwarded).toBe(0)
      expect(result.accepted).toBe(true)
    })

    it('does not call the transaction for duplicates', async () => {
      dedup.isProcessed.mockResolvedValue(true)
      await service.processEvent(baseInput)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('point calculation', () => {
    it('awards 100 points for DEAL_WON', async () => {
      const result = await service.processEvent({ ...baseInput, eventType: EventType.DEAL_WON })
      expect(result.pointsAwarded).toBe(100)
    })

    it('awards 20 points for MEETING_COMPLETED', async () => {
      const result = await service.processEvent({ ...baseInput, eventType: EventType.MEETING_COMPLETED })
      expect(result.pointsAwarded).toBe(20)
    })

    it('awards 10 points for LEAD_CONTACTED', async () => {
      const result = await service.processEvent({ ...baseInput, eventType: EventType.LEAD_CONTACTED })
      expect(result.pointsAwarded).toBe(10)
    })

    it('awards 30 points for STAGE_ADVANCED', async () => {
      const result = await service.processEvent({ ...baseInput, eventType: EventType.STAGE_ADVANCED })
      expect(result.pointsAwarded).toBe(30)
    })

    it('XP floor is 0 — never negative even with DEAL_LOST on 0 XP', async () => {
      usersService.getStats.mockResolvedValue(makeStats({ totalXP: 0, totalPoints: 0 }))
      const txMock = makeTxMock(makeStats({ totalXP: 0, totalPoints: -20 }))
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
      const result = await service.processEvent({ ...baseInput, eventType: EventType.DEAL_LOST })
      expect(result.user?.totalXP).toBeGreaterThanOrEqual(0)
    })
  })

  describe('daily cap', () => {
    it('sets capReached:true and pointsAwarded:0 when cap count is at max', async () => {
      prisma.dailyCap.findUnique.mockResolvedValue({
        id: 'cap-1', userId: 'user-1', eventType: EventType.LEAD_CONTACTED, date: new Date(), count: 5,
      })
      const result = await service.processEvent({ ...baseInput, eventType: EventType.LEAD_CONTACTED })
      expect(result.capReached).toBe(true)
      expect(result.pointsAwarded).toBe(0)
    })

    it('does not cap if count is below limit', async () => {
      prisma.dailyCap.findUnique.mockResolvedValue({
        id: 'cap-1', userId: 'user-1', eventType: EventType.LEAD_CONTACTED, date: new Date(), count: 4,
      })
      const result = await service.processEvent({ ...baseInput, eventType: EventType.LEAD_CONTACTED })
      expect(result.capReached).toBe(false)
      expect(result.pointsAwarded).toBe(10)
    })

    it('does not cap uncapped event types', async () => {
      const result = await service.processEvent({ ...baseInput, eventType: EventType.DEAL_WON })
      expect(result.capReached).toBe(false)
      expect(result.pointsAwarded).toBe(100)
    })
  })

  describe('level thresholds', () => {
    it('reflects level 2 when XP crosses 100', async () => {
      usersService.getStats.mockResolvedValue(makeStats({ totalXP: 90, totalPoints: 90, level: 1 }))
      const txMock = makeTxMock(makeStats({ totalXP: 110, totalPoints: 110, level: 2 }))
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
      const result = await service.processEvent({ ...baseInput, eventType: EventType.MEETING_COMPLETED })
      expect(result.user?.level).toBe(2)
    })
  })

  describe('badge unlocks', () => {
    it('includes unlocked badges in response', async () => {
      badgesService.evaluate.mockResolvedValue({ unlocked: [BadgeType.FIRST_WIN] })
      const txMock = makeTxMock(makeStats({ totalXP: 100, totalPoints: 100, level: 2 }))
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
      const result = await service.processEvent(baseInput)
      expect(result.badgesUnlocked).toHaveLength(1)
      expect(result.badgesUnlocked[0].type).toBe(BadgeType.FIRST_WIN)
    })

    it('enqueues badge unlock notification', async () => {
      badgesService.evaluate.mockResolvedValue({ unlocked: [BadgeType.FIRST_WIN] })
      const txMock = makeTxMock(makeStats({ totalXP: 100, totalPoints: 100, level: 2 }))
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))
      await service.processEvent(baseInput)
      expect(notificationQueue.add).toHaveBeenCalledWith(
        expect.stringContaining('BADGE_UNLOCK'),
        expect.objectContaining({ userId: 'user-1', badge: BadgeType.FIRST_WIN }),
      )
    })
  })

  describe('accepted flag', () => {
    it('returns accepted:true for valid non-duplicate events', async () => {
      const result = await service.processEvent(baseInput)
      expect(result.accepted).toBe(true)
    })
  })
})
