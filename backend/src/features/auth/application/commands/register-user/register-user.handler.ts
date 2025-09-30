import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RoleKey } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthService } from '@features/auth/auth.service';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly prisma: PrismaService, private readonly authService: AuthService) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, displayName } = command;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Bu e-posta adresiyle kayıtlı kullanıcı bulunuyor.');
    }

    const defaultRole = await this.prisma.role.findUnique({ where: { key: RoleKey.PARTICIPANT } });
    if (!defaultRole) {
      throw new InternalServerErrorException('Varsayılan katılımcı rolü bulunamadı.');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await this.authService.hashPassword(password),
        displayName,
        roles: {
          create: [{ role: { connect: { id: defaultRole.id } } }],
        },
      },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });

    return this.authService.generateTokenResponse(user);
  }
}
