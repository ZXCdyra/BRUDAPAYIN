import { IsNumber, IsOptional, IsString, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({ description: 'Login for the new referral user account' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'login must contain only latin letters, digits and _ . -' })
  login!: string;

  @ApiProperty({ description: 'Password for the new referral user account' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ description: 'Referral commission percent (0–100)', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  referralPercent?: number;

  @ApiPropertyOptional({ description: 'Currency for referral balance', example: 'RUB' })
  @IsOptional()
  @IsString()
  currency?: string;
}
