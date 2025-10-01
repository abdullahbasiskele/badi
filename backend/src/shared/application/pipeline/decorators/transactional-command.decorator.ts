import { SetMetadata } from '@nestjs/common';

const TRANSACTIONAL_COMMAND_METADATA = 'cqrs:transactional-command';

export const TransactionalCommand = () =>
  SetMetadata(TRANSACTIONAL_COMMAND_METADATA, true);

export const isTransactionalCommand = (command: object): boolean => {
  if (!command || typeof command !== 'object') {
    return false;
  }
  return (
    Reflect.getMetadata(TRANSACTIONAL_COMMAND_METADATA, command.constructor) ===
    true
  );
};
