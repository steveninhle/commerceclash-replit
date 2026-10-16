import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient, AuthResponse } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  public supabase_public: ReturnType<typeof createClient>;
  //private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set');
    }

    this.supabase_public = createClient(supabaseUrl, supabaseAnonKey);
    //this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  getPublicClient(): SupabaseClient {
    return this.supabase_public;
  }

  // A fresh, non-persisting client per call. `supabase_public` above is a
  // singleton reused across every concurrent request (NestJS services are
  // singletons), but the Supabase JS client is stateful — `verifyOtp`,
  // `setSession`, `refreshSession`, `signInWithPassword`/`signUp` all mutate
  // that *same client's* ambient "current session" as a side effect, which
  // is a browser-tab model, not safe for a multi-user server. Any call that
  // establishes or relies on a session must use its own ephemeral client so
  // one request's auth state can never leak into another's.
  private createEphemeralClient(): ReturnType<typeof createClient> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set');
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async signUp(
    email: string,
    password: string,
    options?: Record<string, unknown>,
  ): Promise<AuthResponse> {
    try {
      const response = await this.createEphemeralClient().auth.signUp({
        email,
        password,
        options: options,
      });
      return response;
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      const errorStack =
        error && typeof error === 'object' && 'stack' in error ? String(error.stack) : '';
      this.logger.error(`Error signing up user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.createEphemeralClient().auth.signInWithPassword({
        email,
        password,
      });
      return response;
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      const errorStack =
        error && typeof error === 'object' && 'stack' in error ? String(error.stack) : '';
      this.logger.error(`Error signing in user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async signOut(
    scope: 'local' | 'global' | 'others' = 'local',
    token?: string,
  ): Promise<{ error: Error | null }> {
    try {
      if (token) {
        const supabaseClient = this.createEphemeralClient();

        await supabaseClient.auth.setSession({
          access_token: token,
          refresh_token: '',
        });

        return await supabaseClient.auth.signOut({ scope });
      }

      return await this.createEphemeralClient().auth.signOut({ scope });
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      const errorStack =
        error && typeof error === 'object' && 'stack' in error ? String(error.stack) : '';
      this.logger.error(`Error signing out user: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async adminCreateUser(
    email: string,
    password: string,
    name?: string,
    passwordSetupEmailPending = false,
  ): Promise<{ id: string; email: string }> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { fullName: name ?? normalizedEmail },
      ...(passwordSetupEmailPending
        ? { app_metadata: { password_setup_email_pending: true } }
        : {}),
    });
    if (error) throw new Error(`Supabase adminCreateUser failed: ${error.message}`);
    if (!data.user) throw new Error('Supabase adminCreateUser returned no user');
    return { id: data.user.id, email: data.user.email! };
  }

  // Generates a recovery token without Supabase sending its own email (unlike
  // auth.resetPasswordForEmail, which auto-sends) and without relying on
  // Supabase's own action_link/redirect_to — that redirect only works for
  // URLs on the project's Supabase-dashboard allow-list, which real emails
  // have shown falls back silently to the wrong host otherwise. Instead we
  // email our own `${frontendUrl}/set-password?token=...&type=recovery` link
  // (via Resend) and verify the token ourselves server-side with
  // verifyRecoveryToken below, sidestepping the allow-list entirely.
  async adminGenerateRecoveryToken(
    email: string,
  ): Promise<{ id: string; email: string; hashedToken: string }> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars not set');
    const normalizedEmail = email.trim().toLowerCase();
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });
    if (error) throw new Error(`Supabase adminGenerateRecoveryToken failed: ${error.message}`);
    if (!data.user) throw new Error('Supabase adminGenerateRecoveryToken returned no user');
    return {
      id: data.user.id,
      email: data.user.email!,
      hashedToken: data.properties.hashed_token,
    };
  }

  // Verifies a recovery token_hash (minted by adminGenerateRecoveryToken)
  // directly via the API, without going through Supabase's own
  // /auth/v1/verify redirect endpoint — returns a live session immediately.
  async verifyRecoveryToken(
    tokenHash: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { data, error } = await this.createEphemeralClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (error) throw new Error(`Supabase verifyRecoveryToken failed: ${error.message}`);
    if (!data.session) throw new Error('Supabase verifyRecoveryToken returned no session');
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  // Used by AuthService.updatePassword — establishes the session from the
  // caller's own access/refresh tokens on a throwaway client, then updates
  // the password on that same client. Never touches the shared client, so a
  // request with no (or invalid) session can't accidentally act on another
  // request's ambient state.
  async updateUserPasswordWithSession(
    accessToken: string,
    refreshToken: string,
    newPassword: string,
  ): Promise<{ id: string }> {
    const client = this.createEphemeralClient();
    const { error: sessionError } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw new Error(`Failed to establish session: ${sessionError.message}`);

    const { data, error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(`Failed to update password: ${error.message}`);
    return { id: data.user.id };
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    const { data, error } = await this.createEphemeralClient().auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw new Error(`Supabase refreshSession failed: ${error.message}`);
    if (!data.session) return null;
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async sendMagicLink(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.createEphemeralClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    if (error) throw new Error(`Magic link failed: ${error.message}`);
  }

  async adminGetUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars not set');
    const normalizedEmail = email.trim().toLowerCase();
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 50, page });
      if (error) throw new Error(`Supabase adminGetUserByEmail failed: ${error.message}`);
      const found = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (found) return { id: found.id, email: found.email! };
      if (data.users.length < 50) return null;
      page++;
    }
  }

  async adminIsPasswordSetupEmailPending(userId: string): Promise<boolean> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars not set');
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error)
      throw new Error(`Supabase adminIsPasswordSetupEmailPending failed: ${error.message}`);
    if (!data.user) throw new Error('Supabase adminIsPasswordSetupEmailPending returned no user');
    return data.user.app_metadata.password_setup_email_pending === true;
  }

  // Server-managed metadata survives the auth.users trigger and webhook retries.
  // Clear it only after the email provider accepts the password setup email.
  async adminSetPasswordSetupEmailPending(userId: string, pending: boolean): Promise<void> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars not set');
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { password_setup_email_pending: pending },
    });
    if (error)
      throw new Error(`Supabase adminSetPasswordSetupEmailPending failed: ${error.message}`);
  }

  async adminUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase env vars not set');
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error(`Supabase adminUpdateUserPassword failed: ${error.message}`);
  }

  async deleteUser(uid: string): Promise<{ error: Error | null }> {
    try {
      // Use service role key for admin operations
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase environment variables are not set');
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
      if (error) {
        this.logger.error(`Error deleting user with uid ${uid}: ${error.message}`, error.stack);
        throw error;
      }
      return { error: null };
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Unknown error';
      const errorStack =
        error && typeof error === 'object' && 'stack' in error ? String(error.stack) : '';
      this.logger.error(`Error deleting user with uid ${uid}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
