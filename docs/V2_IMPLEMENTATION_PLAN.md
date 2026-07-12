# PromApparat Workspace v2 — Implementation Plan

## Objective

Move from a collection of functional screens to one coherent role-based operating system without discarding the stabilized domain logic already implemented.

## Migration strategy

The v2 interface will be introduced incrementally. Existing domain commands, schema migrations, financial engine, Excel importer and repositories remain the source of truth. UI replacement must not duplicate business rules.

## Phase A1 — Shell and navigation

Deliverables:
- role-aware application shell;
- top command bar;
- simplified primary navigation;
- tender-local navigation;
- responsive context drawer;
- route/state model that preserves selected tender and position.

Acceptance criteria:
- manager opens Workday by default;
- head opens department view;
- admin opens Administration;
- inaccessible sections are not rendered;
- browser refresh preserves current working context where safe.

## Phase A2 — Workday v2

Deliverables:
- next-best-action card;
- actionable queue;
- complete / postpone / assign actions;
- personal and department scopes;
- workload estimate;
- alerts grouped by cause;
- explanation for every generated action.

Required domain work:
- persistent Task entity;
- task commands;
- automation idempotency keys;
- SLA rules;
- notification entity.

## Phase A3 — Tender workspace v2

Deliverables:
- three-panel layout;
- tender overview;
- positions table v2;
- contextual position panel;
- tender risks and next action;
- preserved scroll/filter state;
- keyboard navigation.

Existing modules to integrate:
- documents;
- timeline;
- Excel specification import;
- supplier offers;
- financial calculations;
- production batches.

## Phase A4 — Workstream

Deliverables:
- lifecycle columns;
- drag-and-drop with validation;
- stage counts and bottlenecks;
- manager filters;
- blocked-state explanation;
- automatic task transitions.

No stage change may bypass domain commands.

## Phase A5 — Administration v2

Deliverables:
- users and roles;
- financial formulas;
- reference data;
- commercial-offer templates;
- integration settings;
- backup and health status;
- audit log.

## Phase A6 — Backend boundary

Before production rollout:
- define API contracts;
- replace localStorage repository with API repository;
- PostgreSQL schema;
- authentication;
- server-side RBAC;
- file/object storage;
- optimistic concurrency;
- scheduled backups;
- migration tooling.

## Technical guardrails

1. UI components never write business collections directly.
2. All important mutations pass through commands/services.
3. Every command validates permissions and data.
4. Every critical mutation creates an audit event.
5. Automated tasks use deterministic deduplication keys.
6. Calculations use the financial engine only.
7. Published formulas are immutable; edits create a new version.
8. Critical records are archived rather than silently deleted.
9. Tests cover domain behavior before UI behavior.
10. CI must pass lint, tests and build before deployment.

## Immediate build order

### Next implementation sprint: v2 shell

1. Create `AppShellV2`.
2. Create `TopCommandBar`.
3. Replace the current rail with role-based primary navigation.
4. Add tender-local navigation.
5. Add reusable `ContextPanel` / mobile drawer.
6. Keep current screens mounted inside the new shell initially.
7. Add feature flag `workspaceV2` for safe rollback.
8. Add layout and navigation tests.

### Following sprint: persistent tasks

1. Define Task schema.
2. Add migrations.
3. Add create/update/complete/postpone/assign commands.
4. Add automatic task rules.
5. Connect Workday to persisted tasks.
6. Add notification generation.

## What is explicitly postponed

- AI text chat;
- advanced forecasting;
- production map;
- email integration;
- customer portal;
- mobile native application.

These should not be implemented until the v2 shell, tasks and tender workspace are stable.

## Definition of successful v2 transition

- a manager can process a tender from creation to quotation without leaving the tender workspace;
- the Workday screen always shows real persisted work, not only computed hints;
- a head can identify department bottlenecks within one minute;
- an administrator can change rules without exposing formulas to managers;
- no critical action exists only in local component state;
- existing data migrates without loss;
- old UI can be disabled without removing domain functionality.