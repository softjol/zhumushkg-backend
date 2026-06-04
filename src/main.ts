import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { createSwaggerDocument, setupSwaggerDocs } from './swagger-setup';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const PORT = process.env.PORT || 8000;
  const app = await NestFactory.create(AppModule);

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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} не разрешён`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // нужен для httpOnly cookie refresh_token
  });

  const document = createSwaggerDocument(app);
  setupSwaggerDocs(app, document);

  await app.listen(PORT, '0.0.0.0', () =>
    console.log(`[${process.env.NODE_ENV ?? 'development'}] Server started on port ${PORT}`),
  );
}
bootstrap();
