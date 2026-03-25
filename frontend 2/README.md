# Pizza Frontend

Готовый фронтенд под твой backend на Vite + React + TypeScript.

## Что есть
- каталог пицц
- поиск и фильтр по категориям
- регистрация и логин
- корзина
- оформление заказа
- мои заказы
- админ-панель:
  - добавление пиццы
  - скрытие пиццы
  - изменение статуса заказов

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

По умолчанию фронт ждёт backend на `http://localhost:3000`.

## Для связи с backend
В `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Тестовые аккаунты
- admin@pizza.com / admin12345
- user@pizza.com / user12345
