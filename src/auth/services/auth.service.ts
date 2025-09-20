/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '../../../generated/prisma';
import * as argon2 from 'argon2';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserInfoDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '../dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password } = registerDto;

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хэшируем пароль с помощью argon2id
    const passwordHash = await this.hashPassword(password);

    // Создаем нового пользователя
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Генерируем токены
    const tokens = await this.generateTokens(
      user.id,
      user.email || '',
      user.role,
    );

    // Сохраняем refresh токен в базе данных
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.mapUserToDto(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Находим пользователя по email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверяем пароль
    const isPasswordValid = await this.verifyPassword(
      user.passwordHash,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверяем, активен ли пользователь
    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Генерируем токены
    const tokens = await this.generateTokens(
      user.id,
      user.email || '',
      user.role,
    );

    // Сохраняем refresh токен в базе данных
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.mapUserToDto(user),
    };
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Верифицируем refresh токен
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
      });

      // Проверяем, существует ли токен в базе данных
      const storedToken = await this.prisma.authToken.findFirst({
        where: {
          refreshToken,
          revokedAt: null, // Токен не должен быть отозван
          expiresAt: {
            gt: new Date(), // Токен не должен быть истекшим
          },
        },
        include: {
          user: true,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Проверяем, активен ли пользователь
      if (!storedToken.user.isActive) {
        throw new UnauthorizedException('User account is disabled');
      }

      // Генерируем новые токены
      const newTokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email || '',
        storedToken.user.role,
      );

      // Отзываем старый refresh токен
      await this.prisma.authToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Сохраняем новый refresh токен
      await this.saveRefreshToken(storedToken.user.id, newTokens.refreshToken);

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Отзываем все активные refresh токены пользователя
    await this.prisma.authToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Successfully logged out' };
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  private async verifyPassword(
    hash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('app.jwt.accessSecret'),
        expiresIn: this.config.get<string>('app.jwt.accessExpiresIn') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
        expiresIn: this.config.get<string>('app.jwt.refreshExpiresIn') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    // Удаляем старые токены пользователя
    await this.prisma.authToken.deleteMany({
      where: { userId },
    });

    // Получаем срок жизни refresh токена из конфигурации
    const refreshExpiresIn =
      this.config.get<string>('app.jwt.refreshExpiresIn') || '7d';
    const expiresAt = this.calculateExpirationDate(refreshExpiresIn);

    // Сохраняем новый refresh токен
    await this.prisma.authToken.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = Date.now();

    // Парсим строку формата "7d", "15m", "1h" и т.д.
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Если формат не распознан, используем 7 дней по умолчанию
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    let milliseconds = 0;
    switch (unit) {
      case 's': // секунды
        milliseconds = value * 1000;
        break;
      case 'm': // минуты
        milliseconds = value * 60 * 1000;
        break;
      case 'h': // часы
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'd': // дни
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = 7 * 24 * 60 * 60 * 1000; // 7 дней по умолчанию
    }

    return new Date(now + milliseconds);
  }

  private mapUserToDto(user: User): UserInfoDto {
    return {
      id: user.id,
      email: user.email || '',
      role: user.role,
      name: user.name || undefined,
      surname: user.surname || undefined,
    };
  }
}
