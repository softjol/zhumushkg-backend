import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** CDN so Swagger UI works behind Vercel rewrites (local static URLs often 404). */
const SWAGGER_UI_DIST = 'https://unpkg.com/swagger-ui-dist@5.11.0';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Жумушkg API')
    .setDescription('API для приложения Жумуш')
    .setVersion('1.0')
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
