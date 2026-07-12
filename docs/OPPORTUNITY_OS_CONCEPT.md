# PromApparat Opportunity OS

## Product goal

PromApparat Workspace manages the full tender-sales cycle from active discovery of opportunities on procurement platforms through qualification, execution, contract fulfillment, and post-project analytics.

The system is not organized around a passive CRM inbox. Managers actively search platforms. Every search action, discovered opportunity, qualification decision, refusal reason, conversion to project, and final business result must become visible to management.

## Core business flow

Platform monitoring → opportunity discovered → express qualification → take into work or reject → project execution → proposal → contract → fulfillment → retrospective analytics.

## Root entity

The root entity is `Opportunity`.

A project/work is created only after an opportunity is accepted. The opportunity remains linked to the created work so discovery effectiveness can be traced through revenue and profit.

## Workspaces

### Manager

- daily platform route;
- last check time and responsible person;
- discovered-opportunity registry;
- express qualification;
- mandatory refusal reason;
- one-click conversion into an existing project workflow;
- familiar table-first interface.

### Head of department

- route completion by manager;
- search workload;
- unchecked and stale platforms;
- opportunities found, accepted, and rejected;
- bottlenecks and refusal reasons;
- conversion from discovery into active projects.

### Director

- full company visibility;
- source/platform effectiveness;
- funnel from discovery to completed projects;
- forecast and realized profit;
- manager effectiveness;
- rejected-opportunity analysis;
- drill-down from aggregate metrics to source data.

### Administrator

- platform directory;
- routes and responsibilities;
- users and access;
- formulas and system settings;
- backups and integrations.

## Release 3.0 MVP

1. Platform registry with owner, status, check frequency, and last-check timestamp.
2. Daily route progress.
3. Opportunity registry with source platform and deadline.
4. Express qualification: profile fit, manufacturer availability, timing feasibility, commercial interest, and notes.
5. Decisions: accept or reject; rejection requires a reason.
6. Accepting creates a linked project using the existing execution engine.
7. Audit fields and discovery analytics.
8. All new collections are included in migrations, validation, backup, and restore.

## Non-negotiable rules

- The manager should retain a fast table-first workflow familiar from Excel.
- Data entered once must flow automatically to head and director analytics.
- The director can see all company data; managers see their assigned work in the future server-backed version.
- Every aggregate metric must drill down to its source records.
- Existing execution logic—positions, suppliers, formulas, import, documents, and timeline—must be reused rather than rewritten.
