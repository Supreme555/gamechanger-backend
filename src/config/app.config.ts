import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const rawOrigins = process.env.FRONTEND_URL ?? 'http://localhost:5001';
  const corsOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const portEnv = process.env.BACKEND_PORT ?? process.env.PORT;
  const port =
    portEnv && !Number.isNaN(Number(portEnv)) ? Number(portEnv) : 3000;
  const host = process.env.HOST ?? 'localhost';
  const globalPrefix = process.env.GLOBAL_PREFIX ?? 'api';

  // Bitrix24 конфигурация
  const bitrixBaseUrl = process.env.BITRIX_BASE_URL;
  const bitrixWebhook = process.env.BITRIX_WEBHOOK;

  // JWT конфигурация
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  return {
    port,
    host,
    globalPrefix,
    corsOrigins,
    jwt: {
      accessSecret: jwtAccessSecret,
      refreshSecret: jwtRefreshSecret,
      accessExpiresIn: jwtAccessExpiresIn,
      refreshExpiresIn: jwtRefreshExpiresIn,
    },
    bitrix: {
      baseUrl: bitrixBaseUrl,
      webhook: bitrixWebhook,
    },
  };
});
