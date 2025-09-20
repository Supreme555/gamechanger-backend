import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserProfileDto, UserProfileDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { CurrentUserData } from '../../auth/types/current-user.interface';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя успешно получен',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  async getProfile(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserProfileDto> {
    return this.usersService.getUserProfile(user.sub);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiBody({
    type: UpdateUserProfileDto,
    description: 'Данные для обновления профиля',
  })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя успешно обновлен',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для обновления профиля',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - требуется JWT токен',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  @ApiResponse({
    status: 409,
    description: 'Конфликт - email или телефон уже используется',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateData: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateUserProfile(user.sub, updateData);
  }
}
