# PromApparat Workspace — архитектура

## Цель

Frontend не должен зависеть от способа хранения данных. Сегодня используется localStorage для Cloudflare-стенда; при переносе на локальный сервер будет подключен API и PostgreSQL без переписывания экранов.

## Слои

- `src/domain/` — сущности, справочники, вычисления готовности, маржи, рисков и следующих действий.
- `src/data/` — репозитории данных. Сейчас `LocalWorkspaceRepository`; позже `ApiWorkspaceRepository`.
- `src/store/` — React-состояние и синхронизация с репозиторием.
- `src/components/` — интерфейсные модули.
- `src/features/` — будущие модули: works, positions, suppliers, documents, quotes, workflow.

## Главные сущности

- Work
- Position
- Supplier
- SupplierOffer
- ShipmentBatch
- Document
- Task / NextAction
- Customer
- User

## Правило зависимости

`UI -> Store -> Repository -> Storage/API`

UI не обращается напрямую к localStorage, SQLite или PostgreSQL.

## Следующие шаги

1. Перенести компоненты из `main.jsx` в `features/works` и `features/positions`.
2. Подключить `useWorkspace` вместо прямого localStorage.
3. Добавить модуль документов.
4. Добавить `ApiWorkspaceRepository`.
5. Подключить локальный backend и PostgreSQL при финальном переносе.
