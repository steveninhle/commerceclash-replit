import { PrismaService } from '@utils/prisma/prisma.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { Socket } from 'socket.io';
import { PrototypePerkAccess } from './prototype-perk-access';

describe('Prototype perk authorization', () => {
  const originalEnv = { ...process.env };
  const getUser = jest.fn();
  const enrollment = jest.fn();
  const classroom = jest.fn();
  let access: PrototypePerkAccess;
  const socket = (token?: string) =>
    ({
      request: { headers: {} },
      handshake: { auth: token ? { accessToken: token } : {} },
      data: { type: 'teacher', teacherId: 'teacher', studentId: 'student' },
    }) as unknown as Socket;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_PROTOTYPE_PERKS = 'true';
    getUser.mockResolvedValue({ data: { user: { id: 'student' } }, error: null });
    enrollment.mockResolvedValue({ id: 'enrollment' });
    classroom.mockResolvedValue({ instructor_id: 'teacher' });
    access = new PrototypePerkAccess(
      {
        enrolled_students: { findFirst: enrollment },
        renamedclass: { findUnique: classroom },
      } as unknown as PrismaService,
      {
        getPublicClient: () => ({ auth: { getUser } }),
      } as unknown as SupabaseService,
    );
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it('disables forged task/scenario events in production even with the feature flag', async () => {
    process.env.NODE_ENV = 'production';
    await expect(access.student(socket('valid'), 'class', 'student')).rejects.toThrow('disabled');
    expect(getUser).not.toHaveBeenCalled();
  });
  it('requires explicit development opt-in', async () => {
    delete process.env.ENABLE_PROTOTYPE_PERKS;
    await expect(access.student(socket('valid'), 'class', 'student')).rejects.toThrow('disabled');
  });
  it('does not trust identities supplied through join-room', async () => {
    await expect(access.student(socket(), 'class', 'student')).rejects.toThrow('session');
  });
  it('rejects an invalid session', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') });
    await expect(access.student(socket('expired'), 'class', 'student')).rejects.toThrow(
      'Invalid session',
    );
  });
  it('rejects acting as another student', async () => {
    await expect(access.student(socket('valid'), 'class', 'victim')).rejects.toThrow(
      'another student',
    );
    expect(enrollment).not.toHaveBeenCalled();
  });
  it('rejects a student outside the class', async () => {
    enrollment.mockResolvedValue(null);
    await expect(access.student(socket('valid'), 'other-class', 'student')).rejects.toThrow(
      'not enrolled',
    );
  });
  it('accepts a verified student in their own class', async () => {
    await expect(access.student(socket('valid'), 'class', 'student')).resolves.toBeUndefined();
  });
  it('rejects student-controlled class-wide cleanup despite a forged teacher identity', async () => {
    await expect(access.teacher(socket('valid'), 'class')).rejects.toThrow(
      'Only the class instructor',
    );
  });
  it('accepts only the verified instructor of the class for cleanup', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'teacher' } }, error: null });
    await expect(access.teacher(socket('valid'), 'class')).resolves.toBeUndefined();
    classroom.mockResolvedValue({ instructor_id: 'another-teacher' });
    await expect(access.teacher(socket('valid'), 'other-class')).rejects.toThrow(
      'Only the class instructor',
    );
  });
  it('keeps normal target completion available in production with a verified session', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      access.student(socket('valid'), 'class', 'student', false),
    ).resolves.toBeUndefined();
  });
  it('authorizes regular teacher approval in production without prototype flags', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_PROTOTYPE_PERKS;
    getUser.mockResolvedValue({ data: { user: { id: 'teacher' } }, error: null });
    await expect(access.teacher(socket('valid'), 'class', false)).resolves.toBeUndefined();
    classroom.mockResolvedValue({ instructor_id: 'other' });
    await expect(access.teacher(socket('valid'), 'other-class', false)).rejects.toThrow(
      'Only the class instructor',
    );
  });
  it('accepts the existing HttpOnly session cookie', async () => {
    const client = socket();
    client.request.headers.cookie = 'access_token=cookie-session';
    await expect(access.student(client, 'class', 'student')).resolves.toBeUndefined();
    expect(getUser).toHaveBeenCalledWith('cookie-session');
  });
});
