import { Module } from '@nestjs/common'
import { BadgesRepository } from './BadgesRepository'
import { BadgesService } from './BadgesService'

@Module({
  providers: [BadgesRepository, BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
