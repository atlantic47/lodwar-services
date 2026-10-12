# Lodwar Services: Mini Ticket Tracker

A small support-ticket tracker: a Laravel 12 REST API with MySQL and a Vue 3 single-page UI (Vite + Tailwind).

## Features

- Create tickets with a title, an optional description and a priority.
- Change a ticket's **status** or **priority** in place, with Undo.
- Filter by status with live counts, and paginate.
- Soft delete with Undo (deleted tickets can be restored).

## Requirements

- PHP 8.2+ with `pdo_mysql` and `pdo_sqlite`
- Composer
- Node 20+ and npm
- MySQL 8

## Setup

```bash
git clone <repo-url> lodwar-tickets
cd lodwar-tickets

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Create an empty MySQL database (for example `lodwar_tickets`) and set it in `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lodwar_tickets
DB_USERNAME=root
DB_PASSWORD=
```

Create the tables. The seeder adds 30 sample tickets and is optional:

```bash
php artisan migrate --seed
```

## Run

Use two terminals:

```bash
php artisan serve    # API + page  ->  http://127.0.0.1:8000
npm run dev          # Vite dev server (hot reload)
```

Open http://127.0.0.1:8000. For a production-style build, run `npm run build` instead of `npm run dev`.

## Tests

```bash
php artisan test     # backend API tests (PHPUnit, in-memory SQLite)
npm test             # frontend tests (Vitest + Vue Test Utils)
```

Backend tests use in-memory SQLite, so they never touch your MySQL data.

**Backend** (`tests/Feature/TicketApiTest.php`): create (and defaults), validation, list with filter and pagination, invalid query params, update, 404, stats, soft delete and restore.

**Frontend** (`resources/js/__tests__/`): API client, the tickets composable (optimistic update, rollback, undo, pagination fallback), and the status and priority menu, stats tabs, ticket list and create dialog.

## API

All endpoints are under `/api` and always return JSON.

| Method | Path | Description |
|---|---|---|
| POST | `/api/tickets` | Create a ticket. `title` is required. `description`, `priority` (default `medium`) and `status` (default `open`) are optional. Returns `201`. |
| GET | `/api/tickets` | List tickets, newest first. Query: `status=open\|in_progress\|closed`, `page`, `limit` (default 15, max 100). Returns `data` and `meta`. |
| PATCH | `/api/tickets/{id}` | Update `status` and/or `priority`. Other fields are rejected. |
| GET | `/api/tickets/stats` | `{"data": {"open": 0, "in_progress": 0, "closed": 0, "total": 0}}` (zero-filled). |
| DELETE | `/api/tickets/{id}` | Soft delete (extra). Excluded from list and stats. |
| POST | `/api/tickets/{id}/restore` | Restore a soft-deleted ticket (extra). |

Validation errors return `422` with `{message, errors}`. Unknown ids return `404`.

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/tickets \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"title":"Printer is down","priority":"high"}'
```

## Project structure

```
app/Enums/                 TicketStatus, TicketPriority
app/Models/Ticket.php      soft deletes, enum casts, defaults
app/Http/Requests/         Store / Update / List validation
app/Http/Resources/        TicketResource (JSON shape)
app/Http/Controllers/      TicketController
routes/api.php             API routes
tests/Feature/             API tests
resources/js/api.js        fetch client + ApiError
resources/js/composables/  useTickets (state + actions), useToasts
resources/js/components/   OptionMenu, StatsBar, TicketList, NewTicketDialog, ToastStack
resources/js/__tests__/    Vitest tests
```

## Troubleshooting

  Any file showing `0` is empty.
- **Blank page or Vite manifest error**: `npm run dev` must be running (or run `npm run build` once).
- **Cannot connect to the database**: check the `DB_*` values in `.env`, then run `php artisan config:clear`.
- **Tests fail with "could not find driver"**: install the `pdo_sqlite` PHP extension.

## Decisions & Tradeoffs

The API lives under `/api` (Laravel's default prefix) rather than at the root; I assumed this is acceptable, and it keeps the page at `/`. Status and priority are strings backed by PHP enums and validated in Form Requests instead of DB enum columns, so adding a value never needs a risky `ALTER`. Tickets are soft-deleted so history is recoverable, and list and stats exclude them automatically; I added delete and restore endpoints so the UI can offer Undo. `PATCH` accepts only `status` and `priority`, pagination is capped at 100, and a composite `(status, created_at)` index serves the filtered list. In the UI, status and priority are edited in place with optimistic updates that roll back on failure and an Undo toast, because changing status is the most frequent action and should not need a form. Frontend state lives in one composable, with no router or Pinia, to keep the app small. There is no authentication, authorisation or audit trail, only a basic throttle; with more time I would add Sanctum, roles and a status-history table, and decide whether any status may move to any other. Concurrent edits are last-write-wins, so I would add an `updated_at` check. I would also add end-to-end tests (Playwright), debounced search and CI. Tests cover the API (PHPUnit) and the frontend client, composable and components (Vitest).