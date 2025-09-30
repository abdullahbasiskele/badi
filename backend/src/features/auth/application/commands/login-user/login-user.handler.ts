import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { AuthService } from '@features/auth/auth.service';
import { GetAuthUserByEmailQuery } from '../../queries/get-auth-user-by-email/get-auth-user-by-email.query';
import { LoginUserCommand } from './login-user.command';

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly authService: AuthService,
  ) {}

  async execute(command: LoginUserCommand) {
    const { email, password } = command;

    const user = await this.queryBus.execute(
      new GetAuthUserByEmailQuery(email),
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    return this.authService.generateTokenResponse(user);
  }
}
