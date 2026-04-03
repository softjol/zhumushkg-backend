import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

type Req = Parameters<express.Express>[0];
type Res = Parameters<express.Express>[1];

let server: express.Express | null = null;

async function getServer(): Promise<express.Express> {
  if (server) return server;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Жумушkg API')
    .setDescription('API для управления Telegram-ботом')
    .setVersion('1.0')
    .addTag('Telegram')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  server = expressApp;
  return server;
}

export default async function handler(req: Req, res: Res) {
  const app = await getServer();
  return app(req, res);
}

