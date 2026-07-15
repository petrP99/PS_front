# Развёртывание ps-front на ВМ

`ps-front` — React/Vite SPA. В production Node.js не запускается: Node нужен
только на этапе сборки, после чего готовые файлы из `dist` раздаёт nginx.
Этот же nginx проксирует API, OAuth2 и WebSocket в BFF, поэтому браузер работает
с одним origin и адрес BFF не зашивается в JavaScript.

## Рекомендуемый запуск через Docker Compose

Требования к ВМ: Docker Engine с Compose plugin и доступные порты фронта/BFF.

1. Скопировать репозиторий на ВМ и перейти в его каталог.
2. Создать `.env`:

   ```dotenv
   FRONT_PORT=5173
   BFF_UPSTREAM=http://host.docker.internal:9091
   ```

   Значение выше подходит, когда BFF опубликован на порту `9091` той же ВМ.
   Если фронт и BFF находятся в одной Docker-сети, можно указать имя контейнера,
   например `BFF_UPSTREAM=http://bff:9091`, и подключить `ps-front` к этой сети.

3. Собрать и запустить:

   ```bash
   docker compose up -d --build
   ```

4. Проверить:

   ```bash
   docker compose ps
   curl -f http://127.0.0.1:5173/healthz
   docker compose logs --tail=100 ps-front
   ```

Фронт будет доступен по `http://<IP-или-домен-ВМ>:5173`.

Обновление:

```bash
git pull
docker compose up -d --build
```

Остановка:

```bash
docker compose down
```

## Обязательные настройки соседних сервисов

BFF должен быть запущен и доступен nginx по `BFF_UPSTREAM`. Для текущей схемы
авторизации в BFF следует установить:

```dotenv
FRONT_URL=http://<IP-или-домен-ВМ>:5173
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=Lax
```

Для HTTPS используйте публичный URL без внутреннего адреса контейнера:

```dotenv
FRONT_URL=https://bank.example.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=Lax
```

В Keycloak добавьте callback:

```text
http://<IP-или-домен-ВМ>:5173/login/oauth2/code/keycloak
```

или соответствующий HTTPS URL. Также добавьте адрес возврата после logout.
Порты `9091` и внутренних микросервисов не нужно открывать в интернет, если
доступ к ним идёт только через nginx.

## HTTPS и стандартные порты

Для production обычно ставят внешний reverse proxy (Caddy, Traefik или nginx)
на портах 80/443, направляя домен на `127.0.0.1:5173`. Тогда в firewall
открываются только 22, 80 и 443, а порт фронта привязывается к loopback:

```yaml
ports:
  - "127.0.0.1:5173:80"
```

Внешний proxy должен передавать заголовки `Host`, `X-Forwarded-Proto` и
`X-Forwarded-For`, а для `/ws/` поддерживать WebSocket Upgrade.

## Запуск без Docker

Это возможно, но требует Node.js 20 для сборки и системного nginx:

```bash
npm ci
npm run build
```

После сборки скопируйте содержимое `dist/` в каталог nginx и перенесите правила
из `nginx.conf` в конфигурацию системного nginx. В ней нужно заменить
`${BFF_UPSTREAM}` на реальный внутренний URL BFF. Запускать `npm run dev` или
`vite --host` как production-сервер не следует: это сервер разработки.

## Что важно при диагностике

- `502 Bad Gateway` — nginx не может подключиться к `BFF_UPSTREAM`.
- Возврат на неверный адрес после входа — неверный `FRONT_URL` в BFF.
- Ошибка `invalid_redirect_uri` — callback не добавлен в клиент Keycloak.
- API возвращает HTML — запрос не попал в BFF; проверьте путь и nginx config.
- WebSocket не подключается — проверьте `/ws/`, Upgrade headers и доступность BFF.
