import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

const user = { id: 'student-id', email: 'student@example.test', app_metadata: {} };

describe('Supabase password setup email metadata', () => {
  const admin = {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    updateUserById: jest.fn(),
  };
  let service: SupabaseService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(createClient)
      .mockReturnValue({ auth: { admin } } as unknown as ReturnType<typeof createClient>);
    admin.createUser.mockResolvedValue({ data: { user }, error: null });
    admin.getUserById.mockResolvedValue({ data: { user }, error: null });
    admin.updateUserById.mockResolvedValue({ data: { user }, error: null });
    service = new SupabaseService(
      new ConfigService({
        SUPABASE_URL: 'https://auth.example.test',
        SUPABASE_ANON_KEY: 'anon-placeholder',
        SUPABASE_SERVICE_KEY: 'service-placeholder',
      }),
    );
  });

  it('persists the pending-email flag in the same request that creates the account', async () => {
    await service.adminCreateUser(' STUDENT@example.test ', 'RandomPassword', 'Student', true);
    expect(admin.createUser).toHaveBeenCalledWith({
      email: user.email,
      password: 'RandomPassword',
      email_confirm: true,
      user_metadata: { fullName: 'Student' },
      app_metadata: { password_setup_email_pending: true },
    });
  });

  it('does not mark accounts created with an upfront password as needing setup email', async () => {
    await service.adminCreateUser(user.email, 'ChosenPassword', 'Student');
    expect(admin.createUser.mock.calls[0][0]).not.toHaveProperty('app_metadata');
  });

  it.each([true, false, undefined])(
    'recognizes only an explicit pending flag (%s)',
    async (flag) => {
      admin.getUserById.mockResolvedValue({
        data: { user: { ...user, app_metadata: { password_setup_email_pending: flag } } },
        error: null,
      });
      expect(await service.adminIsPasswordSetupEmailPending(user.id)).toBe(flag === true);
      expect(admin.getUserById).toHaveBeenCalledWith(user.id);
    },
  );

  it('propagates lookup failure instead of treating delivery as complete', async () => {
    admin.getUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'Lookup failed' },
    });
    await expect(service.adminIsPasswordSetupEmailPending(user.id)).rejects.toThrow(
      'Lookup failed',
    );
  });

  it('acknowledges delivery without changing password or profile metadata', async () => {
    await service.adminSetPasswordSetupEmailPending(user.id, false);
    expect(admin.updateUserById).toHaveBeenCalledWith(user.id, {
      app_metadata: { password_setup_email_pending: false },
    });
  });

  it('propagates failed acknowledgement so the webhook can retry', async () => {
    admin.updateUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' },
    });
    await expect(service.adminSetPasswordSetupEmailPending(user.id, false)).rejects.toThrow(
      'Update failed',
    );
  });
});
