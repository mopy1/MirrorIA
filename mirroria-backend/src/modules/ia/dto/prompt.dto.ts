import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class PromptDto {
  @ApiProperty({ example: 'cuanto vendi en agosto por sucursal' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;
}
