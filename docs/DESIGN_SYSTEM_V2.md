# PromApparat Workspace v2 — Design System

## 1. Design goals

The interface must feel like a professional industrial operations console: calm, dense enough for real work, predictable, fast and trustworthy.

It must avoid:
- decorative dashboards with no actions;
- inconsistent card styles;
- excessive gradients;
- hidden controls;
- modal-heavy workflows;
- ambiguous colors;
- oversized whitespace in operational tables.

## 2. Layout

### Global shell
- left navigation: 240–280 px;
- top command bar: 56–64 px;
- center workspace: flexible;
- context panel: 320–380 px;
- content max width only for analytics and admin pages, never for operational tables.

### Breakpoints
- desktop: 1440 px and wider;
- laptop: 1024–1439 px;
- tablet: 768–1023 px;
- mobile: below 768 px.

On laptop, the context panel becomes a slide-over drawer. On mobile, tables become stacked records with preserved primary actions.

## 3. Navigation

Primary items:
- Workday;
- Workstream;
- Tenders;
- Suppliers;
- Documents;
- Analytics;
- Administration.

Rules:
- no more than seven primary items;
- current item always visible;
- counts only for actionable states;
- role-inaccessible items are not rendered;
- tender-local navigation belongs inside tender workspace, not global navigation.

## 4. Typography

Use a neutral sans-serif system stack.

Hierarchy:
- page title: 28–32 px, 700;
- section title: 20–24 px, 700;
- card title: 15–17 px, 700;
- body: 13–14 px;
- table: 12–13 px;
- metadata: 11–12 px;
- numeric KPI: 24–32 px, tabular numbers.

## 5. Color semantics

Colors communicate state, never decoration.

- blue: primary action / active navigation;
- green: completed / safe / ready;
- amber: waiting / requires attention;
- red: overdue / blocked / destructive;
- gray: inactive / archived / secondary;
- violet: system-generated recommendation;

A status must always include text or icon, not color alone.

## 6. Spacing and shape

- base spacing unit: 4 px;
- common gaps: 8, 12, 16, 24 px;
- input height: 36–40 px;
- button height: 36–40 px;
- radius: 8–12 px for controls, 14–18 px for large surfaces;
- shadows only for floating context panels and overlays;
- borders preferred over shadows for operational cards.

## 7. Components

### Action card
Contains:
- action title;
- tender and position context;
- priority;
- deadline;
- estimated duration;
- one primary action.

### Status badge
Must use controlled vocabulary. No free-text colors.

### Data table
Required capabilities:
- sticky header;
- keyboard row navigation;
- column resizing later;
- copy/paste;
- bulk selection;
- inline edit;
- visible validation errors;
- totals row when financially relevant.

### Context panel
Sections:
- summary;
- next action;
- blockers;
- finance;
- tasks;
- recent history.

### Empty state
Must include:
- what is missing;
- why it matters;
- primary action.

### Confirmation
Use native or custom confirmation only for destructive or irreversible operations.

## 8. Form behavior

- autosave only for low-risk text fields;
- financial and status changes require explicit commit or clear blur feedback;
- validation appears next to the field;
- do not clear user input after errors;
- show saved / unsaved state;
- warn before closing unsaved context.

## 9. Tables vs cards

Use tables for:
- positions;
- supplier offers;
- tasks;
- documents;
- production batches;
- financial calculations.

Use cards for:
- next best action;
- alerts;
- summary metrics;
- recommendations;
- empty states.

## 10. Interaction principles

- double-click is optional, never required;
- all important actions work with one click or keyboard;
- opening a position must not lose tender filters or scroll position;
- command bar supports global search and create actions;
- Esc closes drawers;
- Ctrl/Cmd+K opens command palette later;
- Enter confirms inline edits where safe.

## 11. Content rules

Use operational language:
- “Получить ТКП” instead of “Обработать”;
- “Выбрать поставщика” instead of “Продолжить”;
- “2 дня просрочки” instead of “Критично” alone;
- “Валовая прибыль” and “Чистая прибыль” must never be mixed.

## 12. Accessibility

- keyboard-accessible navigation;
- visible focus ring;
- minimum contrast WCAG AA;
- labels for all inputs;
- icons have accessible names or are decorative;
- no critical information conveyed by hover only.

## 13. Design review checklist

Before accepting a screen:
- Is the primary action obvious?
- Can the user understand the state in five seconds?
- Are all numbers clearly labeled?
- Is uncertainty shown honestly?
- Are destructive actions protected?
- Does the screen preserve context?
- Does it work at 1366×768?
- Are empty and error states designed?
- Is the role-specific information correct?
- Does it save time compared with Excel?