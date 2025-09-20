import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DealsService } from '../services/deals.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  DealListResponseDto,
  RepeatDealResponseDto,
  CreateDealDto,
  CreateDealResponseDto,
  DealDetailsDto,
  UpdateDealDto,
  UpdateDealResponseDto,
  DeleteDealResponseDto,
} from '../dto/index';
import { JwtAuthGuard, RolesGuard } from '../../../auth/guards';
import { Roles } from '../../../auth/decorators';
import { UserRole } from '../../../../generated/prisma';

@ApiTags('bitrix24')
@Controller('bitrix24/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user' as UserRole, 'admin' as UserRole, 'manager' as UserRole)
@ApiBearerAuth()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Список сделок из Bitrix24' })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Смещение постраничной выборки (кратно 50)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Список сделок успешно получен',
    type: DealListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  getDeals(@Query('start') start?: string): Promise<DealListResponseDto> {
    const offset = Number.isFinite(Number(start)) ? Number(start) : 0;
    return this.dealsService.listDeals({ start: offset });
  }

  @Post()
  @ApiOperation({ summary: 'Создать новую сделку в Bitrix24' })
  @ApiBody({
    type: CreateDealDto,
    description: 'Данные для создания сделки',
  })
  @ApiResponse({
    status: 201,
    description: 'Сделка успешно создана',
    type: CreateDealResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для создания сделки',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  createDeal(
    @Body() createDealDto: CreateDealDto,
  ): Promise<CreateDealResponseDto> {
    return this.dealsService.createDeal(createDealDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сделку по ID из Bitrix24' })
  @ApiParam({
    name: 'id',
    description: 'ID сделки',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Сделка успешно получена',
    type: DealDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сделка не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  getDealById(@Param('id', ParseIntPipe) id: number): Promise<DealDetailsDto> {
    return this.dealsService.getDealById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Полностью обновить сделку в Bitrix24' })
  @ApiParam({
    name: 'id',
    description: 'ID сделки для обновления',
    example: 123,
  })
  @ApiBody({
    type: UpdateDealDto,
    description: 'Данные для обновления сделки',
  })
  @ApiResponse({
    status: 200,
    description: 'Сделка успешно обновлена',
    type: UpdateDealResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сделка не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  updateDeal(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDealDto: UpdateDealDto,
  ): Promise<UpdateDealResponseDto> {
    return this.dealsService.updateDeal(id, updateDealDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить сделку в Bitrix24' })
  @ApiParam({
    name: 'id',
    description: 'ID сделки для частичного обновления',
    example: 123,
  })
  @ApiBody({
    type: UpdateDealDto,
    description: 'Данные для частичного обновления сделки',
  })
  @ApiResponse({
    status: 200,
    description: 'Сделка успешно обновлена',
    type: UpdateDealResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сделка не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  patchDeal(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDealDto: UpdateDealDto,
  ): Promise<UpdateDealResponseDto> {
    return this.dealsService.updateDeal(id, updateDealDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сделку из Bitrix24' })
  @ApiParam({
    name: 'id',
    description: 'ID сделки для удаления',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Сделка успешно удалена',
    type: DeleteDealResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сделка не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  deleteDeal(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteDealResponseDto> {
    return this.dealsService.deleteDeal(id);
  }

  @Post('repeat/:id')
  @ApiOperation({ summary: 'Повторить заказ (создать сделку из существующей)' })
  @ApiParam({
    name: 'id',
    description: 'ID сделки для повтора',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Сделка успешно повторена',
    type: RepeatDealResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  repeatDeal(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RepeatDealResponseDto> {
    return this.dealsService.repeatDeal(id);
  }
}
