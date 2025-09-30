import { LoginUserHandler } from './login-user/login-user.handler';
import { RefreshAccessTokenHandler } from './refresh-access-token/refresh-access-token.command';
import { RegisterUserHandler } from './register-user/register-user.handler';
import { RevokeRefreshTokenHandler } from './revoke-refresh-token/revoke-refresh-token.command';

export const commandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  RefreshAccessTokenHandler,
  RevokeRefreshTokenHandler,
];

export * from './register-user/register-user.command';
export * from './login-user/login-user.command';
export * from './refresh-access-token/refresh-access-token.command';
export * from './revoke-refresh-token/revoke-refresh-token.command';
