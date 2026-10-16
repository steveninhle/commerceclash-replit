import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PrismaModule } from '@utils/prisma/prisma.module';
import { AppConfigModule } from '@utils/config/config.module';
import { SupabaseModule } from '@utils/supabase/supabase.module';
import { CohortModule } from 'src/cohort/cohort.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [PrismaModule, AppConfigModule, SupabaseModule, CohortModule, AuthModule, EmailModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
