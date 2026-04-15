# SMS Integration Setup Guide

## Что было изменено:

### 1. Database Schema

- Добавлено поле `smsCode` в таблицу `user` для хранения 6-цифрового кода подтверждения

### 2. API Endpoints

#### Регистрация (Register)

```
POST /auth/register
Content-Type: application/json

{
  "fullName": "Amirbek Amiraev",
  "phoneNumber": "+996777380432",
  "password": "qwer1234",
  "confirm_password": "qwer1234"
}
```

**Ответ:**

```json
{
  "id": 1,
  "fullName": "Amirbek Amiraev",
  "phoneNumber": "+996777380432",
  "phoneConfirmed": false,
  "smsCode": "123456",
  "role": { "id": 1, "role": "USER" }
}
```

**Действие:** Автоматически отправляет SMS код на указанный номер телефона

---

#### Подтверждение номера (Confirm Phone)

```
POST /auth/confirm-phone
Content-Type: application/json

{
  "smsCode": "123456"
}
```

**Ответ:**

```json
{
  "message": "Номер телефона успешно подтвержден"
}
```

**Действие:** Проверяет SMS код и активирует аккаунт

---

#### Вход (Login)

```
POST /auth/login
Content-Type: application/json

{
  "phoneNumber": "+996777380432",
  "password": "qwer1234"
}
```

**Требование:** Номер телефона должен быть подтвержден

**Ответ:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Как получить Twilio учетные данные:

### Шаг 1: Создать аккаунт

1. Перейдите на https://www.twilio.com
2. Нажмите "Sign up"
3. Заполните форму регистрации

### Шаг 2: Верификация

1. Введите номер телефона для верификации
2. Получите SMS код и введите его

### Шаг 3: Получение Credentials

1. Перейдите в Dashboard: https://console.twilio.com
2. Найдите в левом меню "Account Info"
3. Скопируйте:
   - Account SID
   - Auth Token

### Шаг 4: ПолучитьPhone Number

1. В Dashboard найдите "Phone Numbers"
2. Нажмите "Get your first Twilio phone number"
3. Подтвердите номер (выберите страну Кыргызстан, если доступно)
4. Скопируйте полученный номер (формат: +1234567890)

---

## Конфигурация .env файла

Создайте файл `.env` в корне проекта и добавьте:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Примечание: Если `TWILIO_ACCOUNT_SID` не установлен, SMS код будет выведен в консоль

---

## Тестирование в Postman

### 1. Регистрация

- URL: `POST https://zhumushkg-backend-production.up.railway.app//auth/register`
- Body: JSON с данными (см. выше)
- Сохраните `smsCode` из ответа

### 2. Подтверждение

- URL: `POST https://zhumushkg-backend-production.up.railway.app//auth/confirm-phone`
- Body: `{ "smsCode": "xxx" }`
- Используйте код из предыдущего ответа

### 3. Вход

- URL: `POST https://zhumushkg-backend-production.up.railway.app//auth/login`
- Body: `{ "phoneNumber": "+xxx", "password": "xxx" }`

---

## Миграция БД

Если используете TypeORM:

```bash
npm run typeorm migration:generate -- -n AddSmsCode
npm run typeorm migration:run
```

Или вручную выполните SQL:

```sql
ALTER TABLE "user" ADD COLUMN "smsCode" varchar NULL;
```

---

## Troubleshooting

### SMS не приходит

1. Проверьте, что `TWILIO_ACCOUNT_SID` и `TWILIO_AUTH_TOKEN` установлены
2. Проверьте логи консоли - код будет выведен там
3. Проверьте баланс Twilio (минимум $0.01)
4. Убедитесь, что номер телефона в формате: +996777380432

### "Неверный код подтверждения"

1. Код чувствителен к регистру букв
2. Код действителен только один раз
3. Проверьте, что используется последний отправленный код

### ConfigModule ошибка

Убедитесь, что в `auth.module.ts` импортирован `ConfigModule`:

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...]
})
```

---

## Стоимость

**Twilio Trial Account:**

- 15 $USD для отправки SMS
- После потребления депозита, нужна оплата для продолжения

**Коммерческие ставки (примерно):**

- Отправка SMS: $0.0075 - $0.02 за SMS
- Входящие SMS: $0.0075 - $0.02

---

## Production готовность

Для production рекомендуется:

1. Использовать ConfigService вместо process.env
2. Добавить rate limiting для подтверждения
3. Добавить истечение кода (например, 10 минут)
4. Использовать логирование для аудита
5. Добавить механизм переотправки кода
