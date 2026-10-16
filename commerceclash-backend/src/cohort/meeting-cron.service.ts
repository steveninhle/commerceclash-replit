import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@utils/prisma/prisma.service';
import { getMeetingEligibilityWindow } from './meeting-eligibility.util';

@Injectable()
export class MeetingCronService {
  private readonly logger = new Logger(MeetingCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async assignMeetingsToUpcomingClasses() {
    const meetingId = process.env.DEFAULT_MEETING_ID;
    const meetingLink = process.env.DEFAULT_MEETING_LINK;
    const passcode = process.env.DEFAULT_PASSCODE ?? null;

    if (!meetingId || !meetingLink) {
      this.logger.warn('DEFAULT_MEETING_ID or DEFAULT_MEETING_LINK not set — skipping');
      return;
    }

    const now = new Date();
    // A class becomes eligible starting 11 minutes before its start_time and
    // STAYS eligible on every subsequent tick (since meeting_id === '' is the
    // gate, this is idempotent) until it's more than an hour past start.
    // A narrow slice tied 1:1 to the tick interval (e.g. exactly
    // [now+9min, now+11min]) is fragile: a single delayed tick or a write
    // landing at the wrong instant can let a class's start_time slide past
    // that slice between two ticks, permanently skipping it. Widening the
    // window makes this self-healing — a miss on one tick is caught by the
    // next.
    const { windowStart, windowEnd } = getMeetingEligibilityWindow(now);

    // Diagnostic only — never used to alter eligibility. The cron compares
    // absolute UTC instants (start_time is @db.Timestamptz) and must NOT
    // reconvert start_time using cohort.timezone; timezone is logged here
    // purely to make it visible when auditing why a class was or wasn't
    // picked up.
    this.logger.debug(
      `tick: nowUTC=${now.toISOString()} nowServerLocal=${now.toString()} ` +
        `window=[${windowStart.toISOString()}, ${windowEnd.toISOString()}]`,
    );

    const dueClasses = await this.prisma.renamedclass.findMany({
      where: {
        meeting_id: '',
        cohort_id: { not: null },
        start_time: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        name: true,
        start_time: true,
        cohort_id: true,
        cohorts: { select: { timezone: true } },
      },
    });

    if (dueClasses.length === 0) {
      this.logger.debug('tick: no due classes in window — nothing to assign');
      return;
    }

    for (const cls of dueClasses) {
      this.logger.debug(
        `due: class=${cls.id} cohort=${cls.cohort_id} cohortTimezone=${cls.cohorts?.timezone ?? 'null'} ` +
          `start_time=${cls.start_time?.toISOString()} meeting_link(before)='' -> will be set`,
      );
    }

    const result = await this.prisma.renamedclass.updateMany({
      where: { id: { in: dueClasses.map((c) => c.id) } },
      data: { meeting_id: meetingId, meeting_link: meetingLink, passcode },
    });

    this.logger.log(
      `Cron: assigned meeting ${meetingId} to ${result.count} upcoming class(es) ` +
        `[${dueClasses.map((c) => c.id).join(', ')}] ` +
        `meeting_link=${meetingLink} passcode=${passcode ?? 'null'}`,
    );
  }
}
