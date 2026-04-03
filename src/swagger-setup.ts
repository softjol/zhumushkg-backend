import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_UI_DIST = 'https://unpkg.com/swagger-ui-dist@5.11.0';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Жумушkg')
    .setDescription(
      'API для приложения Жумуш. Создание сущностей (вакансия, резюме, отклик и т.д.) доступно только с JWT после регистрации, подтверждения телефона и входа через POST /auth/login.',
    )
    .setVersion('1.0')
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
    .addTag('Telegram')
    .addTag('Вакансии и резюме')
    .build();
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildSwaggerConfig());
}

export function setupSwaggerDocs(
  app: INestApplication,
  document: OpenAPIObject,
): void {
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
