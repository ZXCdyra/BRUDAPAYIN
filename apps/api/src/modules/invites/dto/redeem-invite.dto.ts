import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RedeemInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(3, { message: 'Login must be at least 3 characters' })
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'Login must contain only latin letters, digits and _ . -' })
  login: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
