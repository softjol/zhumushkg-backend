import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { createSwaggerDocument, setupSwaggerDocs } from '../src/swagger-setup';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

let app: any;

async function createApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    'http://localhost:3000,https://zhumushkg-frontend-one.vercel.app,https://zhumushkg-frontend.vercel.app'
  )
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} не разрешён`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  const document = createSwaggerDocument(app);
  setupSwaggerDocs(app, document);

  await app.init();
  return app;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  const nestApp = await createApp();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
