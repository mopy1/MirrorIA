import { IsInt, Max, Min } from 'class-validator';

export class ExtenderDto {
  @IsInt() @Min(1) @Max(365)
  dias!: number;
}
