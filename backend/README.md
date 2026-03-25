# Pizzeria Backend

Готовый backend для сайта пиццерии на:
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT auth

## Что есть
- регистрация и логин
- токен авторизации JWT
- получение текущего пользователя
- 30 видов пиццы
- у каждой пиццы 3 размера: small / medium / large
- корзина
- оформление заказа
- мои заказы
- admin CRUD для пицц
- admin просмотр всех заказов
- изменение статуса заказа

## Установка

```bash
npm install
```

Скопируй `.env.example` в `.env` и заполни данные базы.

## Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init_pizzeria
npm run prisma:seed
```

## Запуск

```bash
npm run dev
```

## Тестовые аккаунты
- admin@pizza.com / admin12345
- user@pizza.com / user12345

## Основные роуты

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/logout`

### Pizzas
- GET `/api/pizzas`
- GET `/api/pizzas/:id`
- POST `/api/pizzas` (admin)
- PUT `/api/pizzas/:id` (admin)
- DELETE `/api/pizzas/:id` (admin)

### Cart
- GET `/api/cart`
- POST `/api/cart/add`
- PUT `/api/cart/:id`
- DELETE `/api/cart/:id`
- DELETE `/api/cart`

### Orders
- POST `/api/orders`
- GET `/api/orders/my`
- GET `/api/orders/admin/all` (admin)
- PATCH `/api/orders/:id/status` (admin)

## Authorization header

```bash
Authorization: Bearer YOUR_TOKEN
```
