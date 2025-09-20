import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({
    description: 'Имя контакта',
    example: 'Иван',
  })
  name: string;

  @ApiProperty({
    description: 'Фамилия контакта',
    example: 'Иванов',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Email контакта',
    example: 'ivan@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Телефон контакта',
    example: '+7 (999) 123-45-67',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Источник контакта',
    example: 'WEB',
    required: false,
  })
  sourceId?: string;

  @ApiProperty({
    description: 'Описание источника',
    example: 'Регистрация через веб-сайт',
    required: false,
  })
  sourceDescription?: string;

  @ApiProperty({
    description: 'Комментарий',
    example: 'Зарегистрирован автоматически',
    required: false,
  })
  comments?: string;

  @ApiProperty({
    description: 'ID ответственного пользователя',
    example: 1,
    required: false,
  })
  assignedById?: number;
}

export class ContactResponseDto {
  @ApiProperty({
    description: 'ID созданного контакта в Bitrix24',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Успешность операции',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Сообщение об операции',
    example: 'Контакт успешно создан в Bitrix24',
    required: false,
  })
  message?: string;
}

export interface Bitrix24ContactFields {
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: Array<{
    VALUE: string;
    VALUE_TYPE: string;
  }>;
  PHONE?: Array<{
    VALUE: string;
    VALUE_TYPE: string;
  }>;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;
  COMMENTS?: string;
  ASSIGNED_BY_ID?: number;
  OPENED?: string; // 'Y' или 'N'
  EXPORT?: string; // 'Y' или 'N'
}

export interface Bitrix24ContactResponse {
  result?: number;
  error?: string;
  error_description?: string;
  time?: {
    start: number;
    finish: number;
    duration: number;
    processing: number;
    date_start: string;
    date_finish: string;
  };
}
