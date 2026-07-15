# PromApparat Workspace

Windows-first CRM для тендерного менеджера и директора.

## Официальная инфраструктура проекта

Только связка:

- GitHub — исходный код и CI;
- Cloudflare Pages — frontend;
- Cloudflare Worker — API;
- Cloudflare D1 — общая база и небольшие документы пилотного периода;
- PowerShell — первичная настройка и развёртывание с Windows.

Внешние платные серверы, Render, PostgreSQL и Docker для production не используются.

## Проверка кода

GitHub Actions запускает два задания:

- `frontend` — тесты и production-сборка React/Vite;
- `cloudflare-api` — синтаксис и тесты Worker API.

## Локальный frontend

```powershell
cd frontend
npm install
npm run dev
```

Открыть `http://localhost:5173`.

Без `VITE_API_URL` приложение работает как локальный демонстрационный прототип.

## Бесплатный серверный режим Cloudflare

Из корня репозитория в PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-cloudflare.ps1
```

Скрипт:

1. устанавливает локальный Wrangler;
2. выполняет вход в Cloudflare;
3. создаёт D1;
4. применяет миграции;
5. создаёт секрет начальной настройки;
6. разворачивает Worker;
7. создаёт первого директора;
8. показывает значение `VITE_API_URL` для Cloudflare Pages.

После этого в Cloudflare Pages добавить production-переменную:

```text
VITE_API_URL=https://<адрес-worker>.workers.dev
```

и запустить новый deployment Pages.

## Ограничения бесплатного пилота

- документы ограничены суммарным размером 20 МБ за одну загрузку;
- файлы сохраняются блоками в D1;
- при достижении бесплатных лимитов Cloudflare операции остановятся до сброса лимита;
- для промышленного объёма файлов потребуется отдельное архитектурное решение, которое подключается только после отдельного согласования.

## Старый backend

Папка `backend` сохранена временно как архив предыдущего серверного прототипа и не используется production-сборкой или Cloudflare deployment.
