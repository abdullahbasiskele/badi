import { SetMetadata } from '@nestjs/common';
import { RequiredAbility } from '../interfaces/required-ability.interface';

export const CHECK_ABILITY_KEY = 'check_ability';

export const CheckAbility = (...requirements: RequiredAbility[]) =>
  SetMetadata(CHECK_ABILITY_KEY, requirements);
