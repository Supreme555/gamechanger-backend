import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения' })
  email: string;

  @ApiProperty({
    description:
      'Пароль пользователя (минимум 6 символов, 1 заглавная буква, 1 цифра)',
    example: 'Password123',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Пароль должен содержать минимум одну заглавную букву и одну цифру',
  })
  password: string;
}
