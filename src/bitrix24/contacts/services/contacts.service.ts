/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  CreateContactDto,
  ContactResponseDto,
  Bitrix24ContactFields,
  Bitrix24ContactResponse,
} from '../dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly config: ConfigService) {}

  private get webhookBase(): string {
    const baseUrl = this.config.get<string>('app.bitrix.baseUrl');
    const webhook = this.config.get<string>('app.bitrix.webhook');

    if (!baseUrl || !webhook) {
      this.logger.warn(
        'Bitrix24 configuration is missing. Contact creation will be skipped.',
      );
      return '';
    }

    return `${baseUrl}/rest/${webhook}`;
  }

  /**
   * Создает контакт в Bitrix24 CRM
   * @param contactData - данные для создания контакта
   * @returns Promise<ContactResponseDto>
   */
  async createContact(
    contactData: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const webhookBase = this.webhookBase;

    // Если конфигурация отсутствует, возвращаем успешный ответ без создания
    if (!webhookBase) {
      this.logger.warn(
        'Skipping Bitrix24 contact creation due to missing configuration',
      );
      return {
        id: 0,
        success: true,
        message: 'Contact creation skipped - Bitrix24 not configured',
      };
    }

    try {
      // Подготавливаем поля для Bitrix24
      const fields: Bitrix24ContactFields = {
        NAME: contactData.name,
        OPENED: 'Y', // Контакт доступен для всех
        EXPORT: 'Y', // Контакт доступен для экспорта
      };

      // Добавляем фамилию, если указана
      if (contactData.lastName) {
        fields.LAST_NAME = contactData.lastName;
      }

      // Добавляем email в формате crm_multifield
      if (contactData.email) {
        fields.EMAIL = [
          {
            VALUE: contactData.email,
            VALUE_TYPE: 'WORK',
          },
        ];
      }

      // Добавляем телефон в формате crm_multifield, если указан
      if (contactData.phone) {
        fields.PHONE = [
          {
            VALUE: contactData.phone,
            VALUE_TYPE: 'WORK',
          },
        ];
      }

      // Добавляем дополнительные поля
      if (contactData.sourceId) {
        fields.SOURCE_ID = contactData.sourceId;
      }

      if (contactData.sourceDescription) {
        fields.SOURCE_DESCRIPTION = contactData.sourceDescription;
      }

      if (contactData.comments) {
        fields.COMMENTS = contactData.comments;
      }

      if (contactData.assignedById) {
        fields.ASSIGNED_BY_ID = contactData.assignedById;
      }

      // Выполняем запрос к Bitrix24 API
      const url = `${webhookBase}/crm.contact.add`;

      this.logger.log(`Creating contact in Bitrix24: ${contactData.email}`);

      const response: AxiosResponse<Bitrix24ContactResponse> = await axios.post(
        url,
        {
          fields,
        },
      );

      const responseData = response.data;

      // Проверяем успешность операции
      if (responseData.result) {
        this.logger.log(
          `Contact created successfully in Bitrix24. ID: ${responseData.result}`,
        );

        return {
          id: responseData.result,
          success: true,
          message: 'Контакт успешно создан в Bitrix24',
        };
      }

      // Обрабатываем ошибку от Bitrix24
      const errorMessage =
        responseData.error_description || responseData.error || 'Unknown error';
      this.logger.error(
        `Failed to create contact in Bitrix24: ${errorMessage}`,
      );

      return {
        id: 0,
        success: false,
        message: `Ошибка создания контакта в Bitrix24: ${errorMessage}`,
      };
    } catch (error) {
      this.logger.error('Error creating contact in Bitrix24:', error);

      // В случае ошибки возвращаем неуспешный результат, но не прерываем основной процесс
      return {
        id: 0,
        success: false,
        message: 'Ошибка при обращении к Bitrix24 API',
      };
    }
  }

  /**
   * Создает контакт из данных пользователя при регистрации
   * @param userData - данные пользователя
   * @returns Promise<ContactResponseDto>
   */
  async createContactFromUser(userData: {
    name?: string;
    surname?: string;
    email: string;
    phone?: string;
  }): Promise<ContactResponseDto> {
    const contactData: CreateContactDto = {
      name: userData.name || 'Пользователь',
      lastName: userData.surname,
      email: userData.email,
      phone: userData.phone,
      sourceId: 'WEB',
      sourceDescription: 'Регистрация через веб-сайт',
      comments: 'Автоматически создан при регистрации пользователя',
    };

    return this.createContact(contactData);
  }
}
