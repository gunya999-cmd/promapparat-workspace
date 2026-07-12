# PromApparat Workspace v2 — Product Blueprint

## 1. Product definition

PromApparat Workspace is not a generic CRM. It is an operating system for a tender sales department that guides work from incoming tender to delivery and closure.

The product must reduce manual work in Excel, email, folders and messengers. Every screen and automation should answer one question: what should the employee do next, and how much time does the system save?

## 2. Core roles

### Tender manager
Primary goals:
- process personal tenders;
- import specifications;
- find suppliers;
- collect and compare quotations;
- calculate economics;
- prepare and send commercial offers;
- track production and shipment;
- avoid missed deadlines.

Default entry screen: **Workday**.

### Head of tender department
Primary goals:
- see department workload;
- see risks, delays and blocked tenders;
- control margin and expected net profit;
- redistribute work;
- approve exceptions and low-margin deals;
- monitor progress by manager.

Default entry screen: **Department control center**.

### Administrator
Primary goals:
- users and roles;
- formulas and financial rules;
- currencies, VAT and reference data;
- templates and integrations;
- backups, audit and system health.

Default entry screen: **Administration**.

## 3. Information architecture

### Main navigation

1. Workday
2. Workstream
3. Tenders
4. Suppliers
5. Documents
6. Analytics
7. Administration — admin only

### Workday
Personal operational screen:
- next best action;
- overdue tasks;
- deadlines today;
- suppliers not responding;
- tenders ready for quotation;
- client follow-ups;
- estimated workload;
- quick completion and postponement.

### Workstream
Department dispatch view:
- New;
- Analysis;
- Supplier search;
- Waiting for quotations;
- Calculation;
- Quotation ready;
- Quotation sent;
- Negotiation;
- Contract;
- Production;
- Shipment;
- Closed.

### Tender workspace
Three-panel layout:

- left: tender navigation;
- center: active working area;
- right: context, next action, risks, reminders and quick operations.

Sections:
- Overview;
- Positions;
- Suppliers;
- Documents;
- Excel import;
- Commercial offer;
- Tasks;
- Production;
- Logistics;
- Finance;
- Timeline.

## 4. Tender lifecycle

1. New
2. Analysis
3. Participation decision
4. Specification prepared
5. Supplier search
6. Requests sent
7. Waiting for quotations
8. Offers received
9. Supplier selected
10. Sale price calculated
11. Commercial offer prepared
12. Commercial offer sent
13. Negotiation
14. Contract
15. Purchase order
16. Production
17. Ready
18. Partial shipment
19. Shipment completed
20. Closed successfully / lost / archived

Every stage transition must:
- validate prerequisites;
- write an audit event;
- close obsolete tasks;
- create required next tasks;
- recalculate dashboard and risks.

## 5. Position lifecycle

1. Imported / created
2. Needs supplier
3. Request sent
4. Waiting for quotation
5. Quotation received
6. Offer selected
7. Sale price calculated
8. Included in commercial offer
9. Ordered
10. In production
11. Ready
12. Partially shipped
13. Shipped
14. Closed

A position may have:
- multiple supplier offers;
- only one selected offer;
- multiple production and shipment batches;
- individual financial parameters;
- linked documents and tasks.

## 6. Primary user journeys

### Manager: new tender

1. Create tender.
2. Import Excel specification.
3. Verify mapped columns and duplicates.
4. Confirm positions.
5. System creates supplier-search tasks.
6. Add suppliers and send requests.
7. Record quotations.
8. Select supplier.
9. Calculate sale price and economics.
10. Generate commercial offer.
11. Send and create follow-up task.
12. After win, create purchase and production flow.
13. Track batches and shipment.
14. Close tender.

### Head: morning review

1. Open department control center.
2. Review overdue tenders and blocked positions.
3. Review low-margin cases.
4. Review workload by manager.
5. Reassign work or approve exceptions.
6. Open highest-risk tender in one click.

### Administrator: financial rule publication

1. Upload or create formula.
2. Map variables.
3. Validate against test cases.
4. Mark verified.
5. Set validity dates.
6. Publish.
7. System writes audit event and applies rule to calculations.

## 7. Permission model

### Manager
- view and edit assigned tenders;
- work with positions, suppliers, documents and tasks;
- generate quotations;
- no access to source formulas or system settings.

### Head
- all manager permissions;
- view all department tenders;
- reassign managers;
- approve low margin and exceptions;
- view department analytics.

### Admin
- system configuration;
- formulas;
- users and roles;
- backups and integrations;
- may view business data only when explicitly granted.

Server-side enforcement is mandatory in production.

## 8. UX principles

1. One primary action per screen.
2. Show the next required step before secondary information.
3. Avoid modal chains; edit in place or in contextual side panels.
4. Preserve user context when moving between tender, position and supplier.
5. Never hide financial uncertainty: unknown purchase price must remain unknown.
6. Destructive actions require confirmation and audit.
7. Empty states must explain what to do next.
8. Tables support keyboard navigation, copy/paste and bulk operations.
9. Manager screens prioritize speed; admin screens prioritize control and traceability.
10. Every automatic recommendation must explain why it was produced.

## 9. Context panel contract

The right panel always contains:
- current entity summary;
- next best action;
- blockers and risks;
- linked tasks;
- financial snapshot;
- recent activity;
- quick actions.

It must never duplicate the center panel.

## 10. Data domains

Core entities:
- User
- Role
- Work/Tender
- Position
- Supplier
- SupplierOffer
- Document
- Task
- Notification
- CommercialOffer
- CommercialOfferVersion
- PurchaseOrder
- ProductionBatch
- Shipment
- FinancialRule
- FormulaVersion
- ActivityEvent
- ImportOperation
- Customer

All entities require:
- stable ID;
- createdAt / updatedAt;
- createdBy / updatedBy where applicable;
- archival state instead of silent deletion for critical business records.

## 11. Automation rules

Examples:
- new position → create “Find supplier” task;
- request sent → create follow-up task based on SLA;
- quotation received → create “Compare offers” task;
- low margin → require head approval;
- quotation sent → create client follow-up in two working days;
- production date passed → create critical alert;
- shipment completed → offer tender closure task.

Automations must be idempotent: repeated evaluation must not create duplicate tasks.

## 12. Product metrics

The system should measure:
- average time from tender creation to first supplier request;
- average time waiting for supplier quotation;
- average preparation time for commercial offer;
- percentage of positions with selected supplier;
- deadline compliance;
- gross and net profit;
- manager workload;
- win rate;
- supplier response time and reliability;
- manual actions saved by automation.

## 13. Release sequence

### Release A — Product architecture
- blueprint;
- role journeys;
- navigation model;
- design system;
- target screen wireframes.

### Release B — Workday
- tasks;
- notifications;
- automatic task creation;
- completion and postponement;
- personal and department views.

### Release C — Tender workspace v2
- three-panel shell;
- contextual right panel;
- unified navigation;
- keyboard-first position work.

### Release D — Commercial offer workflow
- templates;
- versions;
- PDF/Excel generation;
- approval and sending history.

### Release E — Production and logistics
- purchase orders;
- manufacturing milestones;
- shipment batches;
- delays and alerts.

### Release F — Backend and security
- PostgreSQL;
- authentication;
- server-side RBAC;
- file storage;
- audit integrity;
- backups.

### Release G — Intelligence
- risk prediction;
- supplier recommendation;
- margin optimization;
- workload balancing;
- explainable next-best-action engine.

## 14. Definition of done for any feature

A feature is complete only when:
- business rule is documented;
- permissions are defined;
- command/service layer performs the change;
- audit event is created;
- validation exists;
- empty, loading and error states exist;
- tests cover critical logic;
- responsive behavior is verified;
- the feature improves a measurable workflow.