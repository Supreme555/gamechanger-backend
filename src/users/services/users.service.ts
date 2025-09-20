/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserProfileDto, UserProfileDto } from '../dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        surname: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      ...user,
      email: user.email || undefined,
      phone: user.phone || undefined,
      name: user.name || undefined,
      surname: user.surname || undefined,
      address: user.address || undefined,
    };
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем уникальность email, если он изменяется
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    // Проверяем уникальность телефона, если он изменяется
    if (updateData.phone && updateData.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: updateData.phone },
      });

      if (phoneExists) {
        throw new ConflictException(
          'Пользователь с таким телефоном уже существует',
        );
      }
    }

    // Обновляем пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        surname: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      email: updatedUser.email || undefined,
      phone: updatedUser.phone || undefined,
      name: updatedUser.name || undefined,
      surname: updatedUser.surname || undefined,
      address: updatedUser.address || undefined,
    };
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
