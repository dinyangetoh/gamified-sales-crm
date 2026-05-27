import { Module } from '@nestjs/common'
import { BadgesService } from './BadgesService'

@Module({
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
