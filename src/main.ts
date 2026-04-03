import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { createSwaggerDocument, setupSwaggerDocs } from './swagger-setup';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // ⚠️ для разработки
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
