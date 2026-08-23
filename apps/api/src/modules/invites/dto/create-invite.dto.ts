import { IsEnum, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { UserRole } from '@p2p/shared';

export class CreateInviteDto {
  @IsString()
  @MinLength(3, { message: 'Login must be at least 3 characters' })
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'Login must contain only latin letters, digits and _ . -' })
  login: string;

  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  role: UserRole;

  @IsString()
  frontendUrl?: string;
}
