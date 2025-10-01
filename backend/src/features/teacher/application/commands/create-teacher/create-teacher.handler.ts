import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RoleKey } from '@prisma/client';
import { randomBytes } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '@features/auth/auth.service';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateTeacherCommand } from './create-teacher.command';
import { CreateTeacherResponseDto } from '../../dto/create-teacher-response.dto';

@CommandHandler(CreateTeacherCommand)
@Injectable()
export class CreateTeacherHandler
  implements ICommandHandler<CreateTeacherCommand, CreateTeacherResponseDto>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async execute(
    command: CreateTeacherCommand,
  ): Promise<CreateTeacherResponseDto> {
    const email = command.email.trim().toLowerCase();
    const displayName = command.displayName.trim();
    const subject = command.subject.trim();

    if (!subject) {
      throw new BadRequestException('Branş (subject) boş olamaz.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
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

    const teacherRole = await this.prisma.role.findUnique({
      where: { key: RoleKey.TEACHER },
    });

    if (!teacherRole) {
      throw new InternalServerErrorException('TEACHER rolü tanımlı değil.');
    }

    const password = command.password?.trim() || this.generatePassword();
    const temporaryPassword = command.password ? null : password;

    const passwordHash = await this.authService.hashPassword(password);

    const created = await this.prisma.runInTransaction(async () =>
      this.prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash,
          organizationId,
          roles: {
            create: [{ role: { connect: { id: teacherRole.id } } }],
          },
          subjectScopes: {
            create: [{ subject }],
          },
        },
      }),
    );

    return plainToInstance(CreateTeacherResponseDto, {
      id: created.id,
      email: created.email,
      displayName: created.displayName,
      subject,
      organizationId,
      temporaryPassword,
    });
  }

  private generatePassword(): string {
    return randomBytes(6).toString('base64url');
  }
}
