import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../utils/supabase/supabase.module';
import { UsersModule } from '../user/users.module';
import { AppConfigModule } from '@utils/config/config.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [SupabaseModule, UsersModule, AppConfigModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
