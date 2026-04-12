# E2E Тесты для zhumushkg-backend

## Структура файлов

```
test/
├── jest-e2e.json              # Конфиг Jest для e2e тестов
├── auth.e2e-spec.ts           # Тесты авторизации
├── application.e2e-spec.ts   # Тесты заявок
├── resume.e2e-spec.ts         # Тесты резюме
└── vacancy.e2e-spec.ts        # Тесты вакансий
```

## Установка зависимостей

Все нужные пакеты уже есть в package.json:

- `@nestjs/testing`
- `supertest`
- `@types/supertest`

## Настройка тестовой базы данных

### 1. Создай `.env.test` в корне проекта:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=zhumush_test      # отдельная БД для тестов!
JWT_SECRET=test_secret
```

### 2. Создай тестовую БД в PostgreSQL:

```sql
CREATE DATABASE zhumush_test;
```

### 3. Обнови `jest-e2e.json` — добавь загрузку .env.test:

Или передавай через команду запуска:

```
cross-env NODE_ENV=test jest --config ./test/jest-e2e.json
```

### 4. В `DatabaseModule` добавь поддержку тестового окружения:

```typescript
// database.module.ts
synchronize: process.env.NODE_ENV === 'test', // авто-миграции только в тестах
dropSchema: process.env.NODE_ENV === 'test',  // чистить БД перед каждым запуском
```

## Запуск тестов

```bash
# Все e2e тесты
npm run test:e2e

# Один файл
npx jest --config ./test/jest-e2e.json test/auth.e2e-spec.ts

# С выводом всех логов
npx jest --config ./test/jest-e2e.json --verbose
```

## Что тестируется

### auth.e2e-spec.ts

| Метод | Роут                | Тест                                                  |
| ----- | ------------------- | ----------------------------------------------------- |
| POST  | /auth/register      | успешная регистрация, дублирование, невалидные данные |
| POST  | /auth/login         | успешный вход, неверный пароль, пустое тело           |
| POST  | /auth/confirm-phone | неверный код, отсутствие кода                         |
| GET   | /auth/profile/:id   | профиль по id, несуществующий id                      |

### application.e2e-spec.ts

| Метод  | Роут                     | Тест                                  |
| ------ | ------------------------ | ------------------------------------- |
| POST   | /applications            | создание, пустое тело                 |
| GET    | /applications            | список                                |
| GET    | /applications/:id        | по id, несуществующий id              |
| PATCH  | /applications/:id/status | обновление статуса, невалидный статус |
| DELETE | /applications/:id        | удаление, несуществующий id           |

### resume.e2e-spec.ts

| Метод  | Роут        | Тест                              |
| ------ | ----------- | --------------------------------- |
| POST   | /resume     | создание, пустое тело, без токена |
| GET    | /resume     | список                            |
| GET    | /resume/:id | по id, несуществующий id          |
| PATCH  | /resume/:id | обновление                        |
| DELETE | /resume/:id | удаление                          |

### vacancy.e2e-spec.ts

| Метод  | Роут         | Тест                                |
| ------ | ------------ | ----------------------------------- |
| POST   | /vacancy     | создание, пустое тело, без токена   |
| GET    | /vacancy     | список, проверка созданной вакансии |
| GET    | /vacancy/:id | по id, несуществующий id            |
| PATCH  | /vacancy/:id | обновление                          |
| DELETE | /vacancy/:id | удаление                            |

## Важные замечания

1. **Подстрой поля DTO** — если у тебя другие поля в `CreateApplicationDto`,
   `ResumeDto`, `VacancyDto` — обнови `testApplication`, `testResume`, `testVacancy`.

2. **ApplicationStatus enum** — в `application.e2e-spec.ts` статус `'REVIEWED'`
   замени на реальное значение из твоего `ApplicationStatus`.

3. **Роуты** — если контроллеры используют другой префикс (например `/resumes`
   вместо `/resume`) — поправь в тестах.

4. **JWT Guard** — если роуты защищены Guard-ами, убедись что токен
   передаётся корректно. Тесты уже добавляют `.set('Authorization', \`Bearer \${authToken}\`)`.
