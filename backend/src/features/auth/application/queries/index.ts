import { GetAuthUserByEmailHandler } from './get-auth-user-by-email/get-auth-user-by-email.query';
import { GetAuthUserByIdHandler } from './get-auth-user-by-id/get-auth-user-by-id.query';
import { GetRefreshTokenByIdHandler } from './get-refresh-token-by-id/get-refresh-token-by-id.query';
import { GetRoleByKeyHandler } from './get-role-by-key/get-role-by-key.query';

export const queryHandlers = [
  GetAuthUserByEmailHandler,
  GetAuthUserByIdHandler,
  GetRefreshTokenByIdHandler,
  GetRoleByKeyHandler,
];

export * from './get-auth-user-by-email/get-auth-user-by-email.query';
export * from './get-auth-user-by-id/get-auth-user-by-id.query';
export * from './get-refresh-token-by-id/get-refresh-token-by-id.query';
export * from './get-role-by-key/get-role-by-key.query';
