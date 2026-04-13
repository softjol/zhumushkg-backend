import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { createSwaggerDocument, setupSwaggerDocs } from './swagger-setup';

async function bootstrap() {
  const PORT = process.env.PORT || 8080;
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const document = createSwaggerDocument(app);
  setupSwaggerDocs(app, document);

  await app.listen(PORT, '0.0.0.0', () =>
    console.log(`Server started ${PORT}`),
  );
}
bootstrap();
