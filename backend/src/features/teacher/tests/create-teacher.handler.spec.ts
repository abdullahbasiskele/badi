import { BadRequestException } from '@nestjs/common';
import { CreateTeacherHandler } from '../application/commands/create-teacher/create-teacher.handler';
import { CreateTeacherCommand } from '../application/commands/create-teacher/create-teacher.command';
import type { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import type { AuthService } from '@features/auth/auth.service';

const prismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  runInTransaction: jest.fn(),
});

describe('CreateTeacherHandler', () => {
  const authService = {
    hashPassword: jest.fn().mockResolvedValue('hashed'),
  } as unknown as AuthService;

  const setup = () => {
    const prisma = prismaMock() as unknown as PrismaService;
    const handler = new CreateTeacherHandler(prisma, authService);
    return { prisma, handler };
  };

  const baseCommand = () =>
    new CreateTeacherCommand(
      'teacher@example.com',
      'Test Teacher',
      'Müzik',
      {
        id: 'admin-1',
        roles: ['organization-admin'],
        subjectScopes: [],
        organizationId: 'org-1',
      },
      undefined,
      undefined,
    );

  it('creates teacher and returns temporary password when none provided', async () => {
    const { prisma, handler } = setup();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'role-1' });
    (prisma.runInTransaction as jest.Mock).mockImplementation(async (fn) => fn());
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@example.com',
      displayName: 'Test Teacher',
    });

    const result = await handler.execute(baseCommand());

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'teacher@example.com', subjectScopes: expect.any(Object) }),
      }),
    );
    expect(result.temporaryPassword).toBeTruthy();
    expect(result.email).toBe('teacher@example.com');
    expect(result.subject).toBe('Müzik');
  });

  it('enforces organization ownership for non system admins', async () => {
    const { handler } = setup();

    const command = new CreateTeacherCommand(
      'teacher@example.com',
      'Test Teacher',
      'Müzik',
      {
        id: 'admin-1',
        roles: ['organization-admin'],
        subjectScopes: [],
        organizationId: 'org-1',
      },
      'org-2',
      undefined,
    );

    await expect(handler.execute(command)).rejects.toBeInstanceOf(BadRequestException);
  });
});
