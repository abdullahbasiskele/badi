import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthService } from '@features/auth/auth.service';
import { LoginUserCommand } from './login-user.command';

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(private readonly prisma: PrismaService, private readonly authService: AuthService) {}

  async execute(command: LoginUserCommand) {
    const { email, password } = command;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const valid = user.passwordHash ? await argon2.verify(user.passwordHash, password) : false;
    if (!valid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    return this.authService.generateTokenResponse(user);
  }
}
