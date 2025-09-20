import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Bootstraps the NestJS application.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Set global API prefix
  const globalPrefix = configService.get<string>('app.globalPrefix') ?? 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for frontend
  app.enableCors({
    origin: configService.get<string[]>('app.corsOrigins') ?? [
      'http://localhost:5001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = configService.get<number>('app.port') ?? 3000;
  const host = configService.get<string>('app.host') ?? 'localhost';
  await app.listen(port, host);

  const appUrl = await app.getUrl();
  logger.log(
    `Server is running on: ${appUrl} (global prefix: /${globalPrefix})`,
  );
}
void bootstrap();
