# PromApparat Workspace — stabilized core rules

## Data model

- Current schema version: `4`.
- Every persisted collection is validated before save.
- Old browser data is migrated automatically.
- Before migration, import, or reset, the repository creates a local snapshot.
- A full JSON export/import is available to administrators in **System**.
- Work numbers use a monotonic counter and the current calendar year; deleting a work never reuses its number.

## Position economics

- An offer affects calculations only when `selected === true`.
- The first offer is never selected implicitly.
- `unitCost = purchase price + logistics per unit + other costs per unit`.
- `profit = (sale price - unit cost) × quantity`.
- `grossMargin = (sale price - unit cost) / sale price × 100`.
- `markup = (sale price - unit cost) / unit cost × 100`.
- Margin and markup are separate indicators and must not be renamed interchangeably.
- VAT is stored explicitly for each position; new positions inherit the administrator default.

## Workflow and dashboard

- Closed works: `Закрыто успешно`, `Закрыто проиграно`, `Архив`.
- Closed positions: `Отгружено`, `Закрыто`.
- Closed entities do not enter the manager action queue.
- Overdue, today, tomorrow, and later deadlines are separate buckets.
- Dashboard headline uses the full action count; the visible queue may show only the first eight items.
- Progress is milestone-based, not based on the mere presence of a status string.

## Audit log

All business mutations should go through domain commands. A structured event contains:

- actor ID and display name;
- entity type and entity ID;
- changed field;
- old and new value;
- source (`ui`, later `excel`, `email`, `api`, etc.);
- operation ID and timestamp.

UI components must not create duplicate price events on every keystroke. Numeric and text edits are committed on blur; discrete status changes are committed immediately.

## Documents

Required document types depend on the work stage. The browser demo stores file metadata only. Binary file storage, download authorization, and antivirus scanning belong to the local backend release.

## Roles

The formulas and system sections are visible only to `admin`. This is a UI guard for the browser prototype. The production backend must enforce the same permissions on every corresponding API endpoint.

## Quality gate

Every frontend change should pass:

```bash
npm run lint
npm run test:run
npm run build
```

GitHub Actions runs the same gate. Direct dependency versions and `package-lock.json` are committed.
