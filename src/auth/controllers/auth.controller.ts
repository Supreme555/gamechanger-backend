/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '../dto';
import { JwtAuthGuard, RolesGuard } from '../guards';
import { CurrentUser, CurrentUserData, Roles } from '../decorators';
import { UserRole } from '../../../generated/prisma';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Регистрация нового пользователя',
    description:
      'Создает нового пользователя с email и паролем. Пароль автоматически хэшируется с помощью argon2id.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Данные для регистрации пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Пользователь с таким email уже существует',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для регистрации',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Некорректный формат email',
            'Пароль должен содержать минимум 6 символов',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Вход в систему',
    description:
      'Аутентификация пользователя по email и паролю. Возвращает JWT токены для доступа к защищенным ресурсам.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Данные для входа в систему',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные или аккаунт заблокирован',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Неверные учетные данные' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные для входа',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Некорректный формат email',
            'Пароль обязателен для заполнения',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Обновить access токен',
    description:
      'Обновляет истекший access токен с помощью refresh токена. Refresh токен должен быть валидным и не отозванным.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh токен для обновления access токена',
  })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Невалидный или истекший refresh токен',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные запроса',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Refresh токен обязателен для заполнения'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выход из системы',
    description:
      'Отзывает все активные refresh токены пользователя. Требует валидный JWT токен в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный выход из системы',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully logged out' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - отсутствует или невалидный JWT токен',
  })
  async logout(@CurrentUser() user: CurrentUserData) {
    return this.authService.logout(user.sub);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить профиль текущего пользователя',
    description:
      'Возвращает информацию о текущем авторизованном пользователе. Требует JWT токен в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя успешно получен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'user@example.com' },
        role: {
          type: 'string',
          example: 'user',
          enum: ['user', 'admin', 'manager'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован - отсутствует или невалидный JWT токен',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Access token is required' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as UserRole)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Endpoint только для администраторов',
    description:
      'Тестовый endpoint, доступный только пользователям с ролью admin. Требует JWT токен и роль admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Доступ разрешен для администратора',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Welcome, admin!' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа - требуется роль admin',
  })
  adminOnly(@CurrentUser() user: CurrentUserData) {
    return {
      message: `Welcome, admin! You are ${user.email}`,
      timestamp: new Date().toISOString(),
    };
  }
}
