import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../../generated/prisma';

export class UserProfileDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Номер телефона',
    example: '+7 (999) 123-45-67',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Иванов',
  })
  surname?: string;

  @ApiPropertyOptional({
    description: 'Адрес пользователя',
    example: 'г. Москва, ул. Примерная, д. 1',
  })
  address?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: 'user',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Активен ли пользователь',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Дата создания аккаунта',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Номер телефона',
    example: '+7 (999) 123-45-67',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Телефон должен быть строкой' })
  @MaxLength(20, { message: 'Телефон не должен превышать 20 символов' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MaxLength(100, { message: 'Имя не должно превышать 100 символов' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Иванов',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой' })
  @MaxLength(100, { message: 'Фамилия не должна превышать 100 символов' })
  surname?: string;

  @ApiPropertyOptional({
    description: 'Адрес пользователя',
    example: 'г. Москва, ул. Примерная, д. 1',
  })
  @IsOptional()
  @IsString({ message: 'Адрес должен быть строкой' })
  address?: string;
}
