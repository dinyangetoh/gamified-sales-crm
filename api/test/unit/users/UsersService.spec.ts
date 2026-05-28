import { mock, MockProxy } from 'jest-mock-extended'
import { NotFoundException } from '@nestjs/common'
import { BadgeType, Role } from '@prisma/client'
import { UsersService } from '../../../src/modules/users/UsersService'
import { UsersRepository } from '../../../src/modules/users/UsersRepository'

function makeUser(id = 'user-1') {
  return {
    id,
    email: 'test@test.com',
    name: 'Test',
    role: Role.SALES_REP,
    passwordHash: 'x',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('UsersService', () => {
  let service: UsersService
  let usersRepo: MockProxy<UsersRepository>

  beforeEach(() => {
    usersRepo = mock<UsersRepository>()
    service = new UsersService(usersRepo)
  })

  describe('findOrThrow', () => {
    it('returns user when found', async () => {
      const user = makeUser()
      usersRepo.findById.mockResolvedValue(user)
      await expect(service.findOrThrow('user-1')).resolves.toEqual(user)
    })

    it('throws NotFoundException when user is missing', async () => {
      usersRepo.findById.mockResolvedValue(null)
      await expect(service.findOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findByEmail', () => {
    it('delegates to repository', async () => {
      const user = makeUser()
      usersRepo.findByEmail.mockResolvedValue(user)
      await expect(service.findByEmail('test@test.com')).resolves.toEqual(user)
    })
  })

  describe('getProfile', () => {
    it('aggregates earned badges with awardCount and dedupes in-progress', async () => {
      const user = makeUser()
      usersRepo.findById.mockResolvedValue(user)
      usersRepo.findStats.mockResolvedValue({
        userId: user.id,
        totalXP: 100,
        totalPoints: 100,
        level: 2,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      usersRepo.findBadgeAwards.mockResolvedValue([
        { id: 'a1', userId: user.id, badgeType: BadgeType.HOT_STREAK, weekKey: null, awardedAt: new Date('2025-05-01') },
        { id: 'a2', userId: user.id, badgeType: BadgeType.HOT_STREAK, weekKey: null, awardedAt: new Date('2025-05-20') },
      ] as any)
      usersRepo.findBadgeProgressInProgress.mockResolvedValue([
        {
          id: 'p1',
          userId: user.id,
          badgeType: BadgeType.PIPELINE_BUILDER,
          currentCount: 1,
          targetCount: 5,
          weekKey: '2025-W19',
          isCompleted: false,
          updatedAt: new Date('2025-05-01'),
        },
        {
          id: 'p2',
          userId: user.id,
          badgeType: BadgeType.PIPELINE_BUILDER,
          currentCount: 2,
          targetCount: 5,
          weekKey: '2025-W20',
          isCompleted: false,
          updatedAt: new Date('2025-05-10'),
        },
      ] as any)

      const profile = await service.getProfile(user.id)
      expect(profile.badges.earned).toHaveLength(1)
      expect(profile.badges.earned[0].awardCount).toBe(2)
      expect(profile.badges.inProgress).toHaveLength(1)
      expect(profile.badges.inProgress[0].type).toBe(BadgeType.PIPELINE_BUILDER)
    })
  })

  describe('listSalesRepSummaries', () => {
    it('includes eventCount and lastActivityAt when provided by repository', async () => {
      const lastActivityAt = new Date('2025-05-27T10:00:00.000Z')

      usersRepo.findSalesReps.mockResolvedValue([
        {
          id: 'rep-1',
          email: 'rep-1@test.com',
          name: 'Rep One',
          role: Role.SALES_REP,
          passwordHash: 'x',
          createdAt: new Date(),
          updatedAt: new Date(),
          stats: {
            userId: 'rep-1',
            totalXP: 120,
            totalPoints: 120,
            level: 2,
            currentStreak: 3,
            longestStreak: 7,
            lastActivityDate: lastActivityAt,
            updatedAt: new Date(),
          },
          badgeAwards: [{ id: 'b1', userId: 'rep-1', badgeType: 'FIRST_WIN' } as any, { id: 'b2', userId: 'rep-1', badgeType: 'HOT_STREAK' } as any],
          eventCount: 42,
        } as any,
      ])

      const salesRepSummaries = await service.listSalesRepSummaries()
      expect(salesRepSummaries).toHaveLength(1)
      expect(salesRepSummaries[0].userId).toBe('rep-1')
      expect(salesRepSummaries[0].eventCount).toBe(42)
      expect(salesRepSummaries[0].lastActivityAt).toEqual(lastActivityAt)
    })
  })
})
