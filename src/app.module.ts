import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DealsModule } from './bitrix24/deals/deals.module';

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig],
    }),
    DealsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
