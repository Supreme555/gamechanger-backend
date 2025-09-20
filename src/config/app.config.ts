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

  return {
    port,
    host,
    globalPrefix,
    corsOrigins,
  };
});
