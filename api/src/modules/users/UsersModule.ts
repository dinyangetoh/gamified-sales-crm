import { Module } from '@nestjs/common'
import { UsersService } from './UsersService'
import { UsersController } from './UsersController'

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
