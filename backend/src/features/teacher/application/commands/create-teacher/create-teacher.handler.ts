import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RoleKey } from '@prisma/client';
import { randomBytes } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '@features/auth/auth.service';
import { AuthUserRepository, RoleRepository } from '@features/auth/infrastructure/repositories';
import { TeacherRepository } from '@features/teacher/infrastructure/repositories/teacher.repository';
import { PrismaUnitOfWork } from '@shared/infrastructure/prisma/prisma-unit-of-work';
import { CreateTeacherCommand } from './create-teacher.command';
import { CreateTeacherResponseDto } from '../../dto/create-teacher-response.dto';

@CommandHandler(CreateTeacherCommand)
@Injectable()
export class CreateTeacherHandler
  implements ICommandHandler<CreateTeacherCommand, CreateTeacherResponseDto>
{
  constructor(
    private readonly authUsers: AuthUserRepository,
    private readonly roles: RoleRepository,
    private readonly teachers: TeacherRepository,
    private readonly authService: AuthService,
    private readonly unitOfWork: PrismaUnitOfWork,
  ) {}

  async execute(
    command: CreateTeacherCommand,
  ): Promise<CreateTeacherResponseDto> {
    const email = command.email.trim().toLowerCase();
    const displayName = command.displayName.trim();
    const subject = command.subject.trim();

    if (!subject) {
      throw new BadRequestException('Branş boş olamaz.');
    }

    const existing = await this.authUsers.findAuthUserByEmail(email);
    if (existing) {
      throw new BadRequestException('Bu e-posta ile kayıtlı kullanıcı zaten mevcut.');
    }

    const { organizationId: creatorOrgId, roles } = command.createdBy;
    const requestedOrganizationId = command.organizationId?.trim() || null;

    let organizationId: string | null = requestedOrganizationId ?? null;

    const isSystemAdmin = roles.includes('system-admin');
    const isOrganizationAdmin = roles.includes('organization-admin');

    if (isOrganizationAdmin && creatorOrgId) {
      if (organizationId && organizationId !== creatorOrgId) {
        throw new BadRequestException('Başka bir kuruma öğretmen atayamazsınız.');
      }
      organizationId = creatorOrgId;
    }

    if (!isSystemAdmin && !organizationId) {
      throw new BadRequestException('Kurumsal yöneticiler için organizationId zorunludur.');
    }

    if (isSystemAdmin && !organizationId) {
      throw new BadRequestException('Lütfen öğretmenin bağlı olacağı organizationId bilgisini sağlayın.');
    }

    const teacherRole = await this.roles.findByKey(RoleKey.TEACHER);
    if (!teacherRole) {
      throw new InternalServerErrorException('TEACHER rolü tanımlı değil.');
    }

    const password = command.password?.trim() || this.generatePassword();
    const temporaryPassword = command.password ? null : password;
    const passwordHash = await this.authService.hashPassword(password);

    const created = await this.unitOfWork.withTransaction(async (tx) =>
      this.teachers.createTeacher(
        {
          email,
          displayName,
          passwordHash,
          organizationId,
          roleId: teacherRole.id,
          subject,
        },
        tx,
      ),
    );

    const createdSubject = created.subjectScopes.at(0)?.subject ?? subject;

    return plainToInstance(CreateTeacherResponseDto, {
      id: created.id,
      email: created.email,
      displayName: created.displayName,
      subject: createdSubject,
      organizationId: created.organizationId ?? null,
      temporaryPassword,
    });
  }

  private generatePassword(): string {
    return randomBytes(6).toString('base64url');
  }
}
