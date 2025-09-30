import { LoginUserHandler } from './login-user/login-user.handler';
import { RegisterUserHandler } from './register-user/register-user.handler';

export const commandHandlers = [RegisterUserHandler, LoginUserHandler];

export * from './register-user/register-user.command';
export * from './login-user/login-user.command';
