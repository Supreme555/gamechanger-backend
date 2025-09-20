import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DealListResponseDto,
  RepeatDealResponseDto,
  CreateDealDto,
  CreateDealResponseDto,
  DealDetailsDto,
  UpdateDealDto,
  UpdateDealResponseDto,
  DeleteDealResponseDto,
} from '../dto/index';

interface ListDealsParams {
  start?: number;
}

@Injectable()
export class DealsService {
  private stageCache = new Map<string, Map<string, string>>();

  constructor(private readonly config: ConfigService) {}

  private get webhookBase(): string {
    const baseUrl = this.config.get<string>('app.bitrix.baseUrl');
    const webhook = this.config.get<string>('app.bitrix.webhook');

    if (!baseUrl || !webhook) {
      throw new Error(
        'Bitrix24 is not configured. Set BITRIX_BASE_URL and BITRIX_WEBHOOK in environment variables',
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/rest/${webhook.replace(/^\//, '')}`;
    return url;
  }

  private async call<T>(method: string, body: unknown): Promise<T> {
    const url = `${this.webhookBase}/${method}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });

    const data: unknown = await res.json();

    const error = (data as { error?: string } | undefined)?.error;
    if (!res.ok || error) {
      const desc = (data as { error_description?: string } | undefined)
        ?.error_description;
      throw new Error(desc ?? 'Bitrix24 error');
    }
    return (data as { result: T }).result;
  }

  private async getStageNames(
    categoryId: number,
  ): Promise<Map<string, string>> {
    const cacheKey = `DEAL_STAGE_${categoryId}`;

    if (this.stageCache.has(cacheKey)) {
      return this.stageCache.get(cacheKey)!;
    }

    try {
      const stages = await this.call<Array<Record<string, unknown>>>(
        'crm.status.list',
        {
          ENTITY_ID: cacheKey,
          order: { SORT: 'ASC' },
        },
      );

      const stageMap = new Map<string, string>();
      if (Array.isArray(stages)) {
        stages.forEach((stage) => {
          const statusId = String((stage.STATUS_ID as string) ?? '');
          const name = String((stage.NAME as string) ?? statusId);
          if (statusId) {
            stageMap.set(statusId, name);
          }
        });
      }

      this.stageCache.set(cacheKey, stageMap);
      return stageMap;
    } catch {
      // Если не удалось получить стадии, возвращаем пустую карту
      const emptyMap = new Map<string, string>();
      this.stageCache.set(cacheKey, emptyMap);
      return emptyMap;
    }
  }

  async listDeals(params: ListDealsParams): Promise<DealListResponseDto> {
    const start = Number.isFinite(Number(params.start))
      ? Number(params.start)
      : 0;
    const result = await this.call<Array<Record<string, unknown>>>(
      'crm.deal.list',
      {
        SELECT: ['ID', 'TITLE', 'DATE_CREATE', 'STAGE_ID', 'CATEGORY_ID'],
        FILTER: {},
        ORDER: { DATE_CREATE: 'DESC' },
        start,
      },
    );

    const items = Array.isArray(result) ? result : [];
    const next: number | null = items.length >= 50 ? start + 50 : null;

    // Собираем уникальные categoryId для загрузки стадий
    const categoryIds = new Set<number>();
    items.forEach((d) => {
      const categoryId = d.CATEGORY_ID as number | string | undefined;
      if (categoryId != null) {
        categoryIds.add(Number(categoryId));
      }
    });

    // Загружаем стадии для всех категорий параллельно
    const stagePromises = Array.from(categoryIds).map(async (categoryId) => {
      const stages = await this.getStageNames(categoryId);
      return { categoryId, stages };
    });

    const stageResults = await Promise.all(stagePromises);
    const stagesByCategory = new Map<number, Map<string, string>>();
    stageResults.forEach(({ categoryId, stages }) => {
      stagesByCategory.set(categoryId, stages);
    });

    return {
      items: items.map((d) => {
        const categoryId =
          (d.CATEGORY_ID as number | string | undefined) != null
            ? Number(d.CATEGORY_ID as number | string)
            : undefined;
        const stageId = String((d.STAGE_ID as string | undefined) ?? '');

        let stageName: string | undefined;
        if (categoryId != null && stagesByCategory.has(categoryId)) {
          stageName = stagesByCategory.get(categoryId)!.get(stageId);
        }

        return {
          id: Number(d.ID as number | string),
          title: String((d.TITLE as string | undefined) ?? ''),
          dateCreate: String((d.DATE_CREATE as string | undefined) ?? ''),
          stageId,
          stageName,
          categoryId,
        };
      }),
      next,
    };
  }

  async getDealById(id: number): Promise<DealDetailsDto> {
    try {
      // Получаем данные сделки
      const deal = await this.call<Record<string, unknown>>('crm.deal.get', {
        id,
      });

      const categoryId =
        (deal.CATEGORY_ID as number | string | undefined) != null
          ? Number(deal.CATEGORY_ID as number | string)
          : undefined;

      // Получаем название стадии, если есть категория
      let stageName: string | undefined;
      const stageId = String((deal.STAGE_ID as string | undefined) ?? '');
      if (categoryId != null) {
        const stages = await this.getStageNames(categoryId);
        stageName = stages.get(stageId);
      }

      return {
        id: Number(deal.ID as number | string),
        title: String((deal.TITLE as string | undefined) ?? ''),
        dateCreate: String((deal.DATE_CREATE as string | undefined) ?? ''),
        dateModify: String((deal.DATE_MODIFY as string | undefined) ?? ''),
        stageId,
        stageName,
        categoryId,
        opportunity:
          (deal.OPPORTUNITY as number | string | undefined) != null
            ? Number(deal.OPPORTUNITY as number | string)
            : undefined,
        currencyId: (deal.CURRENCY_ID as string | undefined) ?? undefined,
        assignedById:
          (deal.ASSIGNED_BY_ID as number | string | undefined) != null
            ? Number(deal.ASSIGNED_BY_ID as number | string)
            : undefined,
        contactId:
          (deal.CONTACT_ID as number | string | undefined) != null
            ? Number(deal.CONTACT_ID as number | string)
            : undefined,
        companyId:
          (deal.COMPANY_ID as number | string | undefined) != null
            ? Number(deal.COMPANY_ID as number | string)
            : undefined,
        comments: (deal.COMMENTS as string | undefined) ?? undefined,
        closeDate: (deal.CLOSEDATE as string | undefined) ?? undefined,
        opened: (deal.OPENED as string) === 'Y',
        closed: (deal.CLOSED as string) === 'Y',
        typeId: (deal.TYPE_ID as string | undefined) ?? undefined,
        probability:
          (deal.PROBABILITY as number | string | undefined) != null
            ? Number(deal.PROBABILITY as number | string)
            : undefined,
        sourceId: (deal.SOURCE_ID as string | undefined) ?? undefined,
        sourceDescription:
          (deal.SOURCE_DESCRIPTION as string | undefined) ?? undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to get deal ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createDeal(dealData: CreateDealDto): Promise<CreateDealResponseDto> {
    try {
      // Подготавливаем данные для Bitrix24 API
      const bitrixFields: Record<string, unknown> = {
        TITLE: dealData.title,
        STAGE_ID: dealData.stageId || 'NEW',
        CURRENCY_ID: dealData.currencyId || 'RUB',
        CATEGORY_ID: dealData.categoryId || 0,
      };

      // Добавляем опциональные поля только если они переданы
      if (dealData.opportunity !== undefined) {
        bitrixFields.OPPORTUNITY = dealData.opportunity;
      }

      if (dealData.assignedById !== undefined) {
        bitrixFields.ASSIGNED_BY_ID = dealData.assignedById;
      }

      if (dealData.contactId !== undefined) {
        bitrixFields.CONTACT_ID = dealData.contactId;
      }

      if (dealData.companyId !== undefined) {
        bitrixFields.COMPANY_ID = dealData.companyId;
      }

      if (dealData.comments !== undefined) {
        bitrixFields.COMMENTS = dealData.comments;
      }

      if (dealData.closeDate !== undefined) {
        bitrixFields.CLOSEDATE = dealData.closeDate;
      }

      // Создаем сделку через Bitrix24 API
      const result = await this.call<number>('crm.deal.add', {
        fields: bitrixFields,
      });

      return {
        id: result,
        title: dealData.title,
        status: 'success',
      };
    } catch (error) {
      throw new Error(
        `Failed to create deal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async updateDeal(
    id: number,
    dealData: UpdateDealDto,
  ): Promise<UpdateDealResponseDto> {
    try {
      // Подготавливаем данные для Bitrix24 API
      const bitrixFields: Record<string, unknown> = {};

      // Добавляем только переданные поля
      if (dealData.title !== undefined) {
        bitrixFields.TITLE = dealData.title;
      }

      if (dealData.stageId !== undefined) {
        bitrixFields.STAGE_ID = dealData.stageId;
      }

      if (dealData.opportunity !== undefined) {
        bitrixFields.OPPORTUNITY = dealData.opportunity;
      }

      if (dealData.currencyId !== undefined) {
        bitrixFields.CURRENCY_ID = dealData.currencyId;
      }

      if (dealData.assignedById !== undefined) {
        bitrixFields.ASSIGNED_BY_ID = dealData.assignedById;
      }

      if (dealData.contactId !== undefined) {
        bitrixFields.CONTACT_ID = dealData.contactId;
      }

      if (dealData.companyId !== undefined) {
        bitrixFields.COMPANY_ID = dealData.companyId;
      }

      if (dealData.comments !== undefined) {
        bitrixFields.COMMENTS = dealData.comments;
      }

      if (dealData.closeDate !== undefined) {
        bitrixFields.CLOSEDATE = dealData.closeDate;
      }

      if (dealData.categoryId !== undefined) {
        bitrixFields.CATEGORY_ID = dealData.categoryId;
      }

      if (dealData.typeId !== undefined) {
        bitrixFields.TYPE_ID = dealData.typeId;
      }

      if (dealData.probability !== undefined) {
        bitrixFields.PROBABILITY = dealData.probability;
      }

      if (dealData.sourceId !== undefined) {
        bitrixFields.SOURCE_ID = dealData.sourceId;
      }

      if (dealData.sourceDescription !== undefined) {
        bitrixFields.SOURCE_DESCRIPTION = dealData.sourceDescription;
      }

      // Обновляем сделку через Bitrix24 API
      const result = await this.call<boolean>('crm.deal.update', {
        id,
        fields: bitrixFields,
      });

      // Проверяем результат обновления
      if (!result) {
        throw new Error('Failed to update deal in Bitrix24');
      }

      return {
        id,
        status: 'success',
      };
    } catch (error) {
      throw new Error(
        `Failed to update deal ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteDeal(id: number): Promise<DeleteDealResponseDto> {
    try {
      // Удаляем сделку через Bitrix24 API
      const result = await this.call<boolean>('crm.deal.delete', { id });

      // Проверяем результат удаления
      if (!result) {
        throw new Error('Failed to delete deal in Bitrix24');
      }

      return {
        id,
        status: 'success',
      };
    } catch (error) {
      throw new Error(
        `Failed to delete deal ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async repeatDeal(id: number): Promise<RepeatDealResponseDto> {
    try {
      // 1. Получаем данные исходной сделки
      const originalDeal = await this.call<Record<string, unknown>>(
        'crm.deal.get',
        { id },
      );

      // 2. Получаем товарные позиции исходной сделки
      const productRows = await this.call<Array<Record<string, unknown>>>(
        'crm.deal.productrows.get',
        { id },
      );

      // 3. Создаем новую сделку на основе исходной
      const newDealData = {
        TITLE: `Повтор: ${originalDeal.TITLE as string}`,
        STAGE_ID: 'NEW', // Новая сделка всегда начинается с начальной стадии
        OPPORTUNITY: originalDeal.OPPORTUNITY,
        CURRENCY_ID: originalDeal.CURRENCY_ID,
        ASSIGNED_BY_ID: originalDeal.ASSIGNED_BY_ID,
        CONTACT_ID: originalDeal.CONTACT_ID,
        COMPANY_ID: originalDeal.COMPANY_ID,
        COMMENTS: `Повтор сделки #${id}`,
      };

      const newDealId = await this.call<number>('crm.deal.add', {
        fields: newDealData,
      });

      // 4. Копируем товарные позиции в новую сделку
      if (Array.isArray(productRows) && productRows.length > 0) {
        const newProductRows = productRows.map((row) => ({
          PRODUCT_ID: row.PRODUCT_ID,
          PRODUCT_NAME: row.PRODUCT_NAME,
          PRICE: row.PRICE,
          QUANTITY: row.QUANTITY,
          DISCOUNT_TYPE_ID: row.DISCOUNT_TYPE_ID,
          DISCOUNT_RATE: row.DISCOUNT_RATE,
          DISCOUNT_SUM: row.DISCOUNT_SUM,
          TAX_RATE: row.TAX_RATE,
          TAX_INCLUDED: row.TAX_INCLUDED,
          CUSTOMIZED: row.CUSTOMIZED,
          MEASURE_CODE: row.MEASURE_CODE,
          MEASURE_NAME: row.MEASURE_NAME,
        }));

        await this.call('crm.deal.productrows.set', {
          id: newDealId,
          rows: newProductRows,
        });
      }

      return { repeatedFrom: id, newDealId };
    } catch (error) {
      throw new Error(
        `Failed to repeat deal ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
