import { mock, MockProxy } from 'jest-mock-extended'
import { NotFoundException } from '@nestjs/common'
import { Role } from '@prisma/client'
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
})
