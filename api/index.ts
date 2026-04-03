import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { createSwaggerDocument, setupSwaggerDocs } from '../src/swagger-setup';

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

  const document = createSwaggerDocument(app);
  setupSwaggerDocs(app, document);

  await app.init();
  server = expressApp;
  return server;
}

export default async function handler(req: Req, res: Res) {
  try {
    const app = await getServer();
    return app(req, res);
  } catch (err) {
    console.error('[vercel] handler error', err);
    throw err;
  }
}

