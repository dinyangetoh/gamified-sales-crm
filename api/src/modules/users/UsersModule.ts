import { Module } from '@nestjs/common'
import { UsersRepository } from './UsersRepository'
import { UsersService } from './UsersService'
import { UsersController } from './UsersController'

@Module({
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
