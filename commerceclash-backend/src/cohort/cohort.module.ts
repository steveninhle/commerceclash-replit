import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CohortController } from './cohort.controller';
import { CohortService } from './cohort.service';
import { MeetingCronService } from './meeting-cron.service';
import { DataSyncCronService } from './data-sync-cron.service';
import { ZoomMeetingService } from './zoom-meeting.service';
import { PrismaModule } from '@utils/prisma/prisma.module';
import { AppConfigModule } from '@utils/config/config.module';

@Module({
  imports: [PrismaModule, AppConfigModule, ScheduleModule.forRoot()],
  controllers: [CohortController],
  providers: [CohortService, MeetingCronService, DataSyncCronService, ZoomMeetingService],
  exports: [CohortService],
})
export class CohortModule {}
