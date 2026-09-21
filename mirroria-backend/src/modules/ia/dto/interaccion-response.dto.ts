import { ApiProperty } from '@nestjs/swagger';

export class InteraccionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tipo!: string;
  @ApiProperty({ nullable: true }) inputText!: string | null;
  @ApiProperty({ nullable: true }) outputText!: string | null;
  @ApiProperty() createdAt!: Date;
}
