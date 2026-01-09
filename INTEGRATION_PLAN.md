# План интеграций проекта "99 центов"

> Документ описывает полный план разработки с приоритетом: сначала функционал, потом платежи.

---

## Текущее состояние проекта

### Готово ✅

| Компонент | Описание |
|-----------|----------|
| Landing page | Hero, CTA, статистика |
| Интерактивная карта | Leaflet, 999 точек, 47 стран, popup'ы |
| Базовое голосование | Список проектов, кнопка голосования |
| Админ-панель | Авторизация, управление проектами |
| Инфо-страницы | Правила, прозрачность, как работает |
| Мультиязычность | 6 языков (RU, EN, ES, DE, FR, ZH) |
| API routes | /api/stats, /api/vote, /api/projects, /api/payment |
| Prisma схема | Participant, Payment, Project, Vote, VotingPeriod |
| Деплой | GitHub + хостинг |

### Добавлено в Фазе 1 (не протестировано) 🔧

| Компонент | Описание |
|-----------|----------|
| Форма заявок | /apply - подача заявок на помощь |
| Страница голосования | /vote - голосование за заявки |
| Расширенная админка | Дашборд, Модерация, История |
| API заявок | POST /api/applications |
| API голосования | POST /api/applications/vote |
| API админки | /api/admin/applications, /api/admin/stats |
| Prisma схема | Application, ApplicationVote, VotingPeriod |
| IP геолокация | ip-api.com для определения страны |

### Нужно добавить 📋

Из ТЗ v1.2 (в порядке приоритета):

---

## ФАЗА 1: Функционал (без платежей)

### 1.1 Форма подачи заявок на помощь

**Приоритет:** Высокий
**Оценка:** 4-6 часов

**Что делаем:**
- Новая страница `/[locale]/apply`
- Форма с полями:
  - Описание ситуации (200-1000 символов)
  - Необходимая сумма (число)
  - Страна (выпадающий список)
  - Контакт (email/telegram) — приватное поле
  - Чекбокс согласия с правилами (обязательный)
- Валидация на клиенте и сервере
- API endpoint: `POST /api/applications`
- Сохранение в БД (новая модель Application)

**Prisma модель:**
```prisma
model Application {
  id          String   @id @default(cuid())
  description String   @db.Text
  amount      Float
  country     String
  contact     String   // приватное, не показываем публично
  status      ApplicationStatus @default(PENDING)
  periodId    String?
  period      VotingPeriod? @relation(fields: [periodId], references: [id])
  votes       Vote[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ApplicationStatus {
  PENDING      // ожидает модерации
  APPROVED     // одобрена
  SELECTED     // выбрана для голосования (5 случайных)
  WINNER       // победила
  REJECTED     // отклонена
  FUNDED       // средства отправлены
}
```

---

### 1.2 Автоматический случайный отбор заявок

**Приоритет:** Высокий
**Оценка:** 3-4 часа

**Что делаем:**
- Cron job или ручной триггер из админки
- Алгоритм:
  1. Взять все заявки со статусом APPROVED за текущий период
  2. Сгенерировать seed: `hash(timestamp + previousPeriodHash + random)`
  3. Случайно выбрать 5 заявок
  4. Присвоить статус SELECTED
- Логирование процесса отбора
- Отображение на странице голосования: "5 заявок выбраны из X поданных"

**API endpoint:** `POST /api/admin/select-applications`

---

### 1.3 Расширенная система голосования

**Приоритет:** Высокий
**Оценка:** 6-8 часов

**Что делаем:**

#### Ограничения голосования:
- 1 голос в 24 часа (по payment-hash или fingerprint для MVP)
- Нельзя голосовать за одну заявку дважды в сутки
- Нельзя менять голос в течение суток

#### Карточки заявок:
- Описание (обрезанное)
- Страна
- Запрошенная сумма
- Прогресс-бар голосов (%)
- Кнопка "Голосовать"

#### После голосования:
- Кнопка неактивна
- Сообщение: "Ваш голос учтён"
- Таймер до следующего голоса

#### Защита:
- Rate limiting
- Fingerprinting (для MVP без платежей)
- Captcha (опционально)

**Обновить модель Vote:**
```prisma
model Vote {
  id            String   @id @default(cuid())
  visitorHash   String   // fingerprint или payment-hash
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  periodId      String
  period        VotingPeriod @relation(fields: [periodId], references: [id])
  createdAt     DateTime @default(now())

  @@unique([visitorHash, applicationId, periodId]) // один голос за заявку за период
  @@index([visitorHash, createdAt]) // для проверки 24-часового лимита
}
```

---

### 1.4 Периоды голосования

**Приоритет:** Средний
**Оценка:** 3-4 часа

**Что делаем:**
- Модель периодов с датами начала/конца
- Автоматическое закрытие по времени
- Определение победителя (максимум голосов)
- При равенстве — случайный выбор
- История периодов

**Prisma модель:**
```prisma
model VotingPeriod {
  id              String   @id @default(cuid())
  startDate       DateTime
  endDate         DateTime
  status          PeriodStatus @default(COLLECTING)
  winnerId        String?
  totalCollected  Float    @default(0)
  totalTransferred Float?
  transactionHash String?
  applications    Application[]
  votes           Vote[]
  createdAt       DateTime @default(now())
}

enum PeriodStatus {
  COLLECTING  // сбор заявок
  VOTING      // голосование активно
  COMPLETED   // голосование завершено
  FUNDED      // средства отправлены
}
```

---

### 1.5 Геолокация участников

**Приоритет:** Средний
**Оценка:** 2-3 часа

**Что делаем:**
- Определение страны/города по IP (бесплатный API: ip-api.com или ipinfo.io)
- НЕ храним IP
- Сохраняем только: страна + город
- Используем для точки на карте

**API:**
```typescript
// При "платеже" или участии
const geo = await fetch('http://ip-api.com/json/').then(r => r.json());
// { country: "Russia", city: "Moscow", lat: 55.75, lon: 37.61 }
```

---

### 1.6 Расширенная админ-панель

**Приоритет:** Средний
**Оценка:** 4-6 часов

**Что делаем:**

#### Вкладки:
1. **Заявки** — список всех заявок с фильтрами по статусу
2. **Модерация** — одобрить/отклонить заявки
3. **Голосование** — запуск отбора, старт/стоп голосования
4. **Периоды** — история периодов, статистика
5. **Переводы** — подтверждение отправки средств

#### Действия админа:
- Просмотр контактов заявителей (приватно)
- Изменение статуса заявок
- Запуск случайного отбора
- Пометка перевода как выполненного
- Добавление ссылки на транзакцию

---

### 1.7 Страница прозрачности (расширенная)

**Приоритет:** Низкий
**Оценка:** 2-3 часа

**Что делаем:**
- Общий баланс (реальный из БД)
- История распределений
- Ссылки на транзакции (blockchain)
- Статусы переводов
- Один экран, без PDF

---

## ФАЗА 2: Интеграция платежей

### Архитектура мультичейн платежей

```
┌─────────────────────────────────────────────────────────┐
│                    PaymentProvider                       │
│  (единый интерфейс для всех блокчейнов)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Abstract   │  │    BASE     │  │  Ethereum   │     │
│  │    + AGW    │  │  + Wallets  │  │  + Wallets  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                │                │              │
│         ▼                ▼                ▼              │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Unified Payment Interface             │   │
│  │  - connect()                                     │   │
│  │  - pay(amount)                                   │   │
│  │  - getPaymentHash()                              │   │
│  │  - verifyPayment(hash)                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 2.1 Abstract + AGW (Приоритет #1)

**Оценка:** 8-10 часов

**Почему первый:**
- Вход через Google — понятен всем
- Не нужен MetaMask
- Идеально для обычных людей

**Установка:**
```bash
npm install @abstract-foundation/agw-react @abstract-foundation/agw-client
```

**Структура файлов:**
```
src/
├── providers/
│   └── PaymentProvider.tsx      # Единый провайдер
├── lib/
│   └── payment/
│       ├── index.ts             # Экспорт
│       ├── types.ts             # Типы
│       ├── abstract.ts          # Abstract + AGW
│       ├── base.ts              # BASE (позже)
│       └── ethereum.ts          # Ethereum (позже)
├── hooks/
│   └── usePayment.ts            # Хук для компонентов
└── components/
    └── PaymentButton.tsx        # Кнопка оплаты
```

**Интерфейс (types.ts):**
```typescript
export type ChainType = 'abstract' | 'base' | 'ethereum';

export interface PaymentConfig {
  chain: ChainType;
  projectWallet: string;
  usdcAddress: string;
  amount: string; // "0.99"
}

export interface PaymentResult {
  success: boolean;
  hash: string;
  chain: ChainType;
  timestamp: number;
}

export interface PaymentProvider {
  connect(): Promise<string>; // возвращает адрес
  pay(amount: string): Promise<PaymentResult>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getAddress(): string | null;
}
```

**Abstract провайдер (abstract.ts):**
```typescript
import { AbstractWalletProvider, useLoginWithAbstract, useAbstractClient } from '@abstract-foundation/agw-react';

export class AbstractPaymentProvider implements PaymentProvider {
  // ... реализация с AGW
}
```

**Конфигурация сетей:**
```typescript
export const CHAIN_CONFIG = {
  abstract: {
    name: 'Abstract',
    chainId: 2741, // Abstract mainnet
    rpc: 'https://api.abs.xyz',
    usdc: '0x...', // USDC на Abstract
    explorer: 'https://abscan.org',
    walletType: 'agw', // Abstract Global Wallet
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://basescan.org',
    walletType: 'eoa', // обычные кошельки
  },
  // ... другие сети
};
```

---

### 2.2 BASE + обычные кошельки (Приоритет #2)

**Оценка:** 4-6 часов (после Abstract)

**Что делаем:**
- Добавляем ConnectKit или RainbowKit
- Поддержка MetaMask, Coinbase Wallet, WalletConnect
- Тот же интерфейс PaymentProvider

**Установка:**
```bash
npm install connectkit wagmi viem @tanstack/react-query
```

---

### 2.3 Верификация платежей (Backend)

**Оценка:** 4-6 часов

**Что делаем:**

#### API endpoint: `POST /api/payment/verify`
```typescript
// Вход
{
  hash: "0x...",
  chain: "abstract" | "base"
}

// Выход
{
  verified: true,
  paymentHash: "unique-hash-for-voting",
  amount: "0.99",
  timestamp: 1234567890
}
```

#### Логика верификации:
1. Получить транзакцию по hash из блокчейна
2. Проверить:
   - Получатель = наш кошелёк
   - Сумма >= 0.99 USDC
   - Токен = USDC
3. Сгенерировать уникальный payment-hash
4. Сохранить в БД
5. Вернуть payment-hash для голосования

**Prisma модель Payment (обновить):**
```prisma
model Payment {
  id            String   @id @default(cuid())
  txHash        String   @unique
  chain         String   // 'abstract', 'base', etc.
  paymentHash   String   @unique // для голосования
  amount        Float
  walletAddress String
  country       String?
  city          String?
  latitude      Float?
  longitude     Float?
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())
}
```

---

### 2.4 Мониторинг транзакций

**Оценка:** 3-4 часа

**Варианты (бесплатные):**

1. **Polling** — периодически проверять баланс кошелька
2. **The Graph** — бесплатный tier для индексации событий
3. **Webhook от RPC провайдера** — Alchemy/Infura бесплатный tier

**Рекомендация:** Начать с polling, потом добавить The Graph.

---

## ФАЗА 3: Дополнительно (после MVP)

### 3.1 Stripe интеграция (фиат)
- Карты, Apple Pay, Google Pay
- Автоконвертация в USDC
- Комиссия ~3%

### 3.2 Sponspored transactions (gasless)
- Paymaster на Abstract
- Юзер не платит за газ
- Мы платим (или спонсор)

### 3.3 Fiat on-ramp
- Crossmint интеграция (есть в AGW)
- Покупка USDC картой прямо в приложении

---

## Порядок реализации

### Спринт 1: Функционал заявок - СДЕЛАНО
- [x] 1.1 Форма подачи заявок (/apply)
- [x] 1.2 Автоматический отбор (5 случайных из APPROVED)
- [x] Обновление Prisma схемы (Application, ApplicationVote, VotingPeriod)

### Спринт 2: Голосование - СДЕЛАНО
- [x] 1.3 Расширенная система голосования (/vote)
- [x] 1.4 Периоды голосования (COLLECTING -> VOTING -> COMPLETED)
- [x] Защита от накрутки (fingerprint-based, 1 голос/заявка/период)

### Спринт 3: Админка и геолокация - СДЕЛАНО
- [x] 1.5 Геолокация (ip-api.com)
- [x] 1.6 Расширенная админ-панель (3 вкладки: Дашборд, Модерация, История)

### ТРЕБУЕТСЯ ТЕСТИРОВАНИЕ (Фаза 1.1-1.6):
- [ ] Подать тестовую заявку через /apply
- [ ] Одобрить заявку в админке /admin (пароль: admin99)
- [ ] Запустить Выбрать 5 случайных в админке
- [ ] Запустить Запустить голосование
- [ ] Проголосовать на странице /vote
- [ ] Завершить голосование, проверить определение победителя
- [ ] Проверить вкладку История в админке
- [ ] Проверить статистику в дашборде

### Созданные файлы (Фаза 1):
- src/app/[locale]/apply/page.tsx - Форма подачи заявок
- src/app/[locale]/vote/page.tsx - Страница голосования
- src/app/[locale]/admin/page.tsx - Расширенная админ-панель
- src/app/api/applications/route.ts - API подачи заявок
- src/app/api/applications/vote/route.ts - API голосования
- src/app/api/admin/applications/route.ts - API управления заявками
- src/app/api/admin/stats/route.ts - API статистики
- prisma/schema.prisma - Обновленная схема БД

### Спринт 4: Платежи Abstract (2-3 дня)
- [ ] 2.1 Abstract + AGW интеграция
- [ ] 2.3 Верификация платежей
- [ ] Связь payment-hash с голосованием

### Спринт 5: Мультичейн (1-2 дня)
- [ ] 2.2 BASE + кошельки
- [ ] 2.4 Мониторинг транзакций

### Спринт 6: Полировка (1 день)
- [ ] 1.7 Страница прозрачности
- [ ] Финальное тестирование
- [ ] Production деплой

---

## Технический стек (итого)

| Категория | Технология |
|-----------|------------|
| Frontend | Next.js 14+, TypeScript, Tailwind |
| i18n | next-intl (6+ языков) |
| Database | PostgreSQL (PostgreSQL) |
| ORM | Prisma |
| Maps | Leaflet / react-leaflet |
| Payments (Abstract) | @abstract-foundation/agw-react |
| Payments (BASE/ETH) | wagmi, viem, ConnectKit |
| Hosting | Production |
| Blockchain RPC | Public RPCs / Alchemy free tier |

---

## Оценка общего времени

| Фаза | Часы |
|------|------|
| Фаза 1: Функционал | 20-30 |
| Фаза 2: Платежи | 20-26 |
| Тестирование | 5-8 |
| **Итого** | **45-64 часов** |

---

## Следующий шаг

**Фаза 1 (1.1-1.6) ЗАВЕРШЕНА** - код задеплоен на https://99cents.one

Следующие действия:
1. Протестировать весь флоу (заявка -> модерация -> голосование -> победитель)
2. Исправить найденные баги
3. Начать **Фазу 2.1 — Abstract + AGW интеграция**

Деплой: https://99cents.one
Админка: https://99cents.one/ru/admin (пароль: admin99)
