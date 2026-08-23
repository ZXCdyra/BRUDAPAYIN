import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ResetMerchantBalancesDto {
  @ApiPropertyOptional({
    description: 'Обнулить только эту валюту (UUID). Пропуск = все валюты.',
  })
  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @ApiPropertyOptional({ description: 'Комментарий к операции (попадёт в проводки)', example: 'Корректировка' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}
