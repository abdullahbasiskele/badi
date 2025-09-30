import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { RoleKey } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthService } from '@features/auth/auth.service';
import { GetAuthUserByEmailQuery } from '../../queries/get-auth-user-by-email/get-auth-user-by-email.query';
import { GetRoleByKeyQuery } from '../../queries/get-role-by-key/get-role-by-key.query';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, displayName } = command;

    const existing = await this.queryBus.execute(
      new GetAuthUserByEmailQuery(email),
    );
    if (existing) {
      throw new BadRequestException(
        'Bu e-posta adresiyle kayıtlı kullanıcı bulunuyor.',
      );
    }

    const defaultRole = await this.queryBus.execute(
      new GetRoleByKeyQuery(RoleKey.PARTICIPANT),
    );
    if (!defaultRole) {
      throw new InternalServerErrorException(
        'Varsayılan katılımcı rolü bulunamadı.',
      );
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
