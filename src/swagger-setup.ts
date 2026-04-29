import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** CDN so Swagger UI works behind Vercel rewrites (local static URLs often 404). */
const SWAGGER_UI_DIST = 'https://unpkg.com/swagger-ui-dist@5.11.0';

function openApiServerUrl(): string {
  return (
    process.env.OPENAPI_SERVER_URL?.trim() ||
    `http://localhost:${process.env.PORT || 8080}`
  );
}

export function buildSwaggerConfig() {
  return (
    new DocumentBuilder()
      .setTitle('Жумушkg')
      .setOpenAPIVersion('3.0.3')
      .setDescription(
        [
          'API для приложения Жумуш. Эндпоинты создания защищены JWT: регистрация → confirm-phone → login → Authorize в Swagger.',
          '',
          '**OpenAPI:** `GET /openapi.json` (машиночитаемая спецификация), UI: `GET /docs`.',
          'Для продакшена задайте `OPENAPI_SERVER_URL` (например `https://api.example.com`), чтобы в спецификации был верный base URL.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .addServer(openApiServerUrl(), 'API (см. переменную OPENAPI_SERVER_URL)')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'В Swagger нажмите Authorize, вставьте значение access_token из ответа POST /auth/login (без слова Bearer — оно добавится само).',
        },
        'access-token',
      )
      // Auth первым — начинать с регистрации / входа
      .addTag('Auth', 'Регистрация, подтверждение телефона, вход')
      .addTag('App', 'Корень сервиса')
      .addTag('Role', 'Роли')
      .addTag('Resume', 'Резюме и отклики на резюме')
      .addTag('Вакансии', 'Вакансии')
      .addTag('Уведомления', 'SSE и уведомления')
      .build()
  );
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildSwaggerConfig(), {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });
}

/** Публичная OpenAPI 3 спецификация (JSON) для Postman, codegen и т.д. */
export function mountOpenApiJson(
  app: INestApplication,
  document: OpenAPIObject,
  path = '/openapi.json',
): void {
  const http = app.getHttpAdapter();
  http.get(path, (_req: unknown, res: { json: (b: unknown) => void }) => {
    res.json(document);
  });
}

export function setupSwaggerDocs(
  app: INestApplication,
  document: OpenAPIObject,
): void {
  mountOpenApiJson(app, document, '/openapi.json');

  SwaggerModule.setup('docs', app, document, {
    customCssUrl: `${SWAGGER_UI_DIST}/swagger-ui.css`,
    customJs: [
      `${SWAGGER_UI_DIST}/swagger-ui-bundle.js`,
      `${SWAGGER_UI_DIST}/swagger-ui-standalone-preset.js`,
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
