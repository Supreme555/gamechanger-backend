import { Module } from '@nestjs/common';
import { DealsService } from './services/deals.service';
import { DealsController } from './controllers/deals.controller';

@Module({
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
