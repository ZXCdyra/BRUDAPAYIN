import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class TraderCommissionTierDto {
  @ApiProperty({ description: 'Сумма от (включительно), RUB', example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountFrom!: number;

  @ApiPropertyOptional({ description: 'Сумма до (не включая); null/пропуск = без верхней границы', example: 2000 })
  @Type(() => Number)
  @ValidateIf((o) => o.amountTo !== null && o.amountTo !== undefined)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amountTo?: number | null;

  @ApiProperty({ description: 'Процент трейдера для диапазона', example: 11 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percent!: number;
}

export class UpsertTraderCommissionTiersDto {
  @ApiProperty({ enum: ['PAYIN', 'PAYOUT'] })
  @IsEnum(['PAYIN', 'PAYOUT'] as const)
  direction!: 'PAYIN' | 'PAYOUT';

  @ApiProperty({ type: [TraderCommissionTierDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TraderCommissionTierDto)
  tiers!: TraderCommissionTierDto[];
}
