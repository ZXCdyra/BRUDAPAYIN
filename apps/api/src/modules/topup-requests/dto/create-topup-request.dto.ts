import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { BlockchainNetwork } from '@prisma/client';

export class CreateTopUpRequestDto {
  @ApiProperty({ example: 'AABBCCDD1122334455667788AABBCCDD1122334455667788AABBCCDD11223344' })
  @IsString()
  @MinLength(10)
  tx_hash!: string;

  @ApiProperty({ enum: BlockchainNetwork })
  @IsEnum(BlockchainNetwork)
  network!: BlockchainNetwork;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount_usdt!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ApproveTopUpRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  admin_note?: string;
}
