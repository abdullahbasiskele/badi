import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RoleKey } from '@prisma/client';
import { AuthService } from '@features/auth/auth.service';
import { AuthUserRepository, RoleRepository } from '@features/auth/infrastructure/repositories';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly authUsers: AuthUserRepository,
    private readonly roles: RoleRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, displayName } = command;

    const existing = await this.authUsers.findAuthUserByEmail(email);
    if (existing) {
      throw new BadRequestException('Bu e-posta adresiyle kayıtlı kullanıcı bulunuyor.');
    }

    const defaultRole = await this.roles.findByKey(RoleKey.PARTICIPANT);
    if (!defaultRole) {
      throw new InternalServerErrorException('Varsayılan katılımcı rolü bulunamadı.');
    }

    const user = await this.authUsers.createParticipant({
      email,
      passwordHash: await this.authService.hashPassword(password),
      displayName,
      roleId: defaultRole.id,
    });

    return this.authService.generateTokenResponse(user);
  }
}
