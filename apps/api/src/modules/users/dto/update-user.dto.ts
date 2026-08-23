import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'newlogin' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'login must contain only latin letters, digits and _ . -' })
  login?: string;

  @ApiPropertyOptional({ example: 'contact@example.com', description: 'Optional contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Activate or deactivate the account' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'When assigning MERCHANT, supply a display name if no merchant profile exists yet. Optional when renaming an existing merchant.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  merchantName?: string;
}
