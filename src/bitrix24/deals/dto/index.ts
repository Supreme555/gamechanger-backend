import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DealListItemDto {
  @ApiProperty({ description: 'ID сделки', example: 123 })
  id: number;

  @ApiProperty({ description: 'Название сделки', example: 'Заказ #001' })
  title: string;

  @ApiProperty({
    description: 'Дата создания сделки',
    example: '2024-01-15T10:30:00+03:00',
  })
  dateCreate: string;

  @ApiProperty({ description: 'ID стадии сделки', example: 'NEW' })
  stageId: string;

  @ApiPropertyOptional({
    description: 'Название стадии сделки',
    example: 'Новая',
  })
  stageName?: string;

  @ApiPropertyOptional({ description: 'ID категории сделки', example: 0 })
  categoryId?: number;
}

export class DealListResponseDto {
  @ApiProperty({
    description: 'Список сделок',
    type: [DealListItemDto],
  })
  items: DealListItemDto[];

  @ApiPropertyOptional({
    description:
      'Следующий offset для пагинации (null если это последняя страница)',
    example: 50,
  })
  next: number | null;
}

export class RepeatDealResponseDto {
  @ApiProperty({ description: 'ID исходной сделки', example: 123 })
  repeatedFrom: number;

  @ApiProperty({ description: 'ID новой созданной сделки', example: 456 })
  newDealId: number;
}

export class CreateDealDto {
  @ApiProperty({ description: 'Название сделки', example: 'Новая сделка #001' })
  title: string;

  @ApiPropertyOptional({
    description: 'ID стадии сделки',
    example: 'NEW',
    default: 'NEW',
  })
  stageId?: string;

  @ApiPropertyOptional({
    description: 'Сумма сделки',
    example: 100000,
  })
  opportunity?: number;

  @ApiPropertyOptional({
    description: 'Валюта сделки',
    example: 'RUB',
    default: 'RUB',
  })
  currencyId?: string;

  @ApiPropertyOptional({
    description: 'ID ответственного',
    example: 1,
  })
  assignedById?: number;

  @ApiPropertyOptional({
    description: 'ID контакта',
    example: 123,
  })
  contactId?: number;

  @ApiPropertyOptional({
    description: 'ID компании',
    example: 456,
  })
  companyId?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к сделке',
    example: 'Важная сделка от нового клиента',
  })
  comments?: string;

  @ApiPropertyOptional({
    description: 'Дата закрытия сделки',
    example: '2024-12-31T23:59:59+03:00',
  })
  closeDate?: string;

  @ApiPropertyOptional({
    description: 'ID категории сделки',
    example: 0,
    default: 0,
  })
  categoryId?: number;
}

export class CreateDealResponseDto {
  @ApiProperty({ description: 'ID созданной сделки', example: 789 })
  id: number;

  @ApiProperty({
    description: 'Название созданной сделки',
    example: 'Новая сделка #001',
  })
  title: string;

  @ApiProperty({ description: 'Статус создания', example: 'success' })
  status: string;
}

export class DealDetailsDto {
  @ApiProperty({ description: 'ID сделки', example: 123 })
  id: number;

  @ApiProperty({ description: 'Название сделки', example: 'Заказ #001' })
  title: string;

  @ApiProperty({
    description: 'Дата создания сделки',
    example: '2024-01-15T10:30:00+03:00',
  })
  dateCreate: string;

  @ApiProperty({
    description: 'Дата изменения сделки',
    example: '2024-01-16T12:45:00+03:00',
  })
  dateModify: string;

  @ApiProperty({ description: 'ID стадии сделки', example: 'NEW' })
  stageId: string;

  @ApiPropertyOptional({
    description: 'Название стадии сделки',
    example: 'Новая',
  })
  stageName?: string;

  @ApiPropertyOptional({ description: 'ID категории сделки', example: 0 })
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Сумма сделки', example: 100000 })
  opportunity?: number;

  @ApiPropertyOptional({ description: 'Валюта сделки', example: 'RUB' })
  currencyId?: string;

  @ApiPropertyOptional({ description: 'ID ответственного', example: 1 })
  assignedById?: number;

  @ApiPropertyOptional({ description: 'ID контакта', example: 123 })
  contactId?: number;

  @ApiPropertyOptional({ description: 'ID компании', example: 456 })
  companyId?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к сделке',
    example: 'Важная сделка от постоянного клиента',
  })
  comments?: string;

  @ApiPropertyOptional({
    description: 'Дата закрытия сделки',
    example: '2024-12-31T23:59:59+03:00',
  })
  closeDate?: string;

  @ApiPropertyOptional({
    description: 'Открыта ли сделка',
    example: true,
  })
  opened?: boolean;

  @ApiPropertyOptional({
    description: 'Закрыта ли сделка',
    example: false,
  })
  closed?: boolean;

  @ApiPropertyOptional({
    description: 'Тип сделки',
    example: 'SALE',
  })
  typeId?: string;

  @ApiPropertyOptional({
    description: 'Вероятность закрытия (%)',
    example: 50,
  })
  probability?: number;

  @ApiPropertyOptional({
    description: 'ID источника сделки',
    example: 'CALL',
  })
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Описание источника',
    example: 'Входящий звонок',
  })
  sourceDescription?: string;
}

export class UpdateDealDto {
  @ApiPropertyOptional({
    description: 'Название сделки',
    example: 'Обновленная сделка #001',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'ID стадии сделки',
    example: 'PREPARATION',
  })
  stageId?: string;

  @ApiPropertyOptional({
    description: 'Сумма сделки',
    example: 150000,
  })
  opportunity?: number;

  @ApiPropertyOptional({
    description: 'Валюта сделки',
    example: 'USD',
  })
  currencyId?: string;

  @ApiPropertyOptional({
    description: 'ID ответственного',
    example: 2,
  })
  assignedById?: number;

  @ApiPropertyOptional({
    description: 'ID контакта',
    example: 234,
  })
  contactId?: number;

  @ApiPropertyOptional({
    description: 'ID компании',
    example: 567,
  })
  companyId?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к сделке',
    example: 'Обновленный комментарий',
  })
  comments?: string;

  @ApiPropertyOptional({
    description: 'Дата закрытия сделки',
    example: '2025-01-31T23:59:59+03:00',
  })
  closeDate?: string;

  @ApiPropertyOptional({
    description: 'ID категории сделки',
    example: 1,
  })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Тип сделки',
    example: 'SALE',
  })
  typeId?: string;

  @ApiPropertyOptional({
    description: 'Вероятность закрытия (%)',
    example: 75,
  })
  probability?: number;

  @ApiPropertyOptional({
    description: 'ID источника сделки',
    example: 'CALL',
  })
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Описание источника',
    example: 'Входящий звонок от клиента',
  })
  sourceDescription?: string;
}

export class UpdateDealResponseDto {
  @ApiProperty({ description: 'ID обновленной сделки', example: 123 })
  id: number;

  @ApiProperty({ description: 'Статус обновления', example: 'success' })
  status: string;
}

export class DeleteDealResponseDto {
  @ApiProperty({ description: 'ID удаленной сделки', example: 123 })
  id: number;

  @ApiProperty({ description: 'Статус удаления', example: 'success' })
  status: string;
}
