import { BadRequestException } from '@nestjs/common';
import { CreateTeacherHandler } from '../application/commands/create-teacher/create-teacher.handler';
import { CreateTeacherCommand } from '../application/commands/create-teacher/create-teacher.command';
import type { AuthService } from '@features/auth/auth.service';
import type { AuthUserRepository, RoleRepository } from '@features/auth/infrastructure/repositories';
import type { TeacherRepository } from '@features/teacher/infrastructure/repositories/teacher.repository';
import type { PrismaUnitOfWork } from '@shared/infrastructure/prisma/prisma-unit-of-work';

function createHandler() {
  const authUsers = {
    findAuthUserByEmail: jest.fn(),
  } as unknown as AuthUserRepository;

  const roles = {
    findByKey: jest.fn(),
  } as unknown as RoleRepository;

  const teachers = {
    createTeacher: jest.fn(),
  } as unknown as TeacherRepository;

  const authService = {
    hashPassword: jest.fn().mockResolvedValue('hashed'),
  } as unknown as AuthService;

  const unitOfWork = {
    withTransaction: jest.fn((work) => work({} as never)),
  } as unknown as PrismaUnitOfWork;

  const handler = new CreateTeacherHandler(
    authUsers,
    roles,
    teachers,
    authService,
    unitOfWork,
  );
  return { authUsers, roles, teachers, authService, unitOfWork, handler };
}

describe('CreateTeacherHandler', () => {
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
    const { authUsers, roles, teachers, handler, unitOfWork } = createHandler();
    (authUsers.findAuthUserByEmail as jest.Mock).mockResolvedValue(null);
    (roles.findByKey as jest.Mock).mockResolvedValue({ id: 'role-1' });
    (teachers.createTeacher as jest.Mock).mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@example.com',
      displayName: 'Test Teacher',
      organizationId: 'org-1',
      subjectScopes: [{ subject: 'Müzik' }],
    });

    const result = await handler.execute(baseCommand());

    expect(unitOfWork.withTransaction).toHaveBeenCalled();
    expect(teachers.createTeacher).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'teacher@example.com', subject: 'Müzik' }),
      expect.any(Object),
    );
    expect(result.temporaryPassword).toBeTruthy();
    expect(result.email).toBe('teacher@example.com');
    expect(result.subject).toBe('Müzik');
  });

  it('enforces organization ownership for non system admins', async () => {
    const { handler } = createHandler();

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
