import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  // Sin trim, " ana@mail.com" fallaba @IsEmail; el lowercase lo hace AuthService.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
