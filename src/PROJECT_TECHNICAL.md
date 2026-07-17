# PayFlow / техническая карта

PayFlow — микросервисная финансовая система. Frontend работает через BFF, а домены обмениваются REST-запросами и событиями Kafka.

## 1. Архитектура

[[PAYFLOW_C4_DIAGRAM]]

BFF завершает OAuth2 Authorization Code Flow, хранит сессию в HttpOnly-cookie, передаёт access token бизнес-сервисам и проксирует WebSocket-каналы уведомлений и переводов.

## 2. Стек технологий

- **Frontend:** JavaScript, React 18, React Router 6, Vite 5, CSS.
- **Backend:** Java 17/21, Spring Boot 3.2, Spring Cloud Gateway.
- **Интеграции:** REST/JSON, OpenFeign, RestClient, WebSocket, Apache Kafka.
- **Безопасность:** Keycloak, OAuth2, OpenID Connect, JWT, серверная BFF-сессия.
- **Данные:** PostgreSQL 16, Redis 7, Liquibase.
- **Наблюдаемость:** Micrometer, OpenTelemetry, Prometheus, Grafana, Loki, Tempo, Grafana Alloy.
- **Инфраструктура:** Docker, Docker Compose, Kafka UI и exporters.

## 3. Сервисы

- **ps_front** — клиентский SPA-интерфейс.
- **bff** — единая публичная точка входа, OAuth2-сессия, Token Relay и маршрутизация.
- **ps_core** — клиенты, счета, карты, балансы, платежи, курсы и администрирование.
- **ps_transfer** — расчёт, выполнение и история переводов.
- **ps_cashback** — категории, начисления и выплаты кешбэка.
- **ps_notification** — хранение и WebSocket-доставка уведомлений.
- **Keycloak** — идентификация и авторизация пользователей.

## 4. Маршрут запроса

1. React отправляет запрос в BFF с session cookie.
2. BFF проверяет сессию, добавляет access token и направляет запрос нужному сервису.
3. Результат возвращается через BFF; статусы переводов и уведомления приходят по WebSocket.

## 5. Kafka: кто и куда пишет

| Топик | Producer | Consumer | Назначение |
| --- | --- | --- | --- |
| `ps-transfer-execute` | `ps_transfer` | `ps_core` | Команда на списание и зачисление средств |
| `ps-transfer-result` | `ps_core` | `ps_transfer` | Результат изменения балансов и финальный статус перевода |
| `ps-payment-events` | `ps_core` | `ps_cashback` | Успешный платёж для расчёта кешбэка |
| `ps-notifications` | `ps_core` | `ps_notification` | Событие для центра уведомлений |
| `ps-account-close` | `ps_core` | `ps_core` | Асинхронное закрытие счёта и связанных сущностей |

## 6. Используемые паттерны проектирования

- **Backend for Frontend** — единая точка входа, серверная сессия и Token Relay.
- **Database per Service** — каждый бизнес-сервис владеет своей базой данных PostgreSQL.
- **Transactional Outbox** — core и transfer сохраняют доменную операцию и событие в одной транзакции.
- **Idempotent Consumer** — core не выполняет одну команду перевода повторно.
- **Asynchronous Request-Reply** — перевод проходит через пару топиков execute/result.
- **Retry + exponential backoff** — повторная публикация outbox-событий и вызовов cashback → core.
- **Circuit Breaker** — ограничивает каскадные ошибки при недоступности core для cashback.
- **Distributed Lock** — ShedLock не допускает параллельный запуск cron-задач в cashback и core.

## 7. Наблюдаемость и запуск

- Micrometer и OpenTelemetry передают сквозной `traceId` через BFF, внутренние HTTP-вызовы и Kafka.
- По `traceId` можно связать логи в Loki со spans в Tempo.
- Сборка в отдельные Docker-образы, объединяются общей сетью `ps-observability-net`.

Наблюдение через:
- Kafka UI
- Grafana (Logs/Monitoring/Trace)

