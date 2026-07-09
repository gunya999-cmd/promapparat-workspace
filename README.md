# PromApparat Workspace v0.02 Windows

Локальный прототип рабочего места тендерного менеджера без Docker.

## Что добавлено в v0.02

- Модуль «Работы» стал полноценным CRUD.
- Создание новой работы из интерфейса.
- Редактирование работы.
- Удаление работы вместе с позициями и документами.
- Поиск по коду, заказчику, названию, объекту.
- Фильтры по источнику и срочности.
- Сохранение в SQLite.
- Обновленная правая панель управления работой.

## Запуск

Окно 1:

```powershell
cd D:\Programming\PromApparatWorkspace
.\start-backend.ps1
```

Окно 2:

```powershell
cd D:\Programming\PromApparatWorkspace
.\start-frontend.ps1
```

Открыть:

```text
http://localhost:3000
```

API:

```text
http://localhost:8000/docs
```

## База

SQLite-файл создается автоматически:

```text
backend/promapparat_workspace.db
```
