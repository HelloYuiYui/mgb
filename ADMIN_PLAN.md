# Owner Admin Panel — Action Plan

> **Status (Oct 2026): agreed, not started.** Work is broken into tickets in
> [TICKETS.md](TICKETS.md); this document is the design those tickets implement.

A private, owner-only area, used mainly on a phone, where the barber blocks whole days,
date ranges or time windows, sees upcoming appointments, and enters bookings taken by
phone, all without faking appointments.

---

## 1. Scope

**In this version**

| Capability | Ticket |
|---|---|
| Owner login (username + password, single owner) | #5 |
| Block a whole day, a date range, or a time window on one or more days | #6, #7 |
| Delete blocks | #6, #7 |
| Agenda of upcoming appointments, with tap-to-call and a Maps link | #8 |
| Manual booking for phone/in-person customers (no emails sent) | #9 |

Groundwork done first: slot tests (#1), a shared availability helper (#2), booking
validation fixes (#3), and RLS with a service-role key (#4).

**Later (not in this version)**

- Cancelling appointments from the admin panel, with an "email the customer" checkbox
  ticked by default (#10). Until then cancellations are handled off-platform; deleting the
  row in Supabase frees the slot.
- Weekly opening hours and editable settings (booking window, minimum notice, day
  start/end) (#11).

**Not planned:** customer self-cancellation, multiple barbers.

---

## 2. Authentication (#5)

Supabase Auth with **username + password**, one owner account.

- Supabase Auth identifies users by email, so the login form asks for a username and the
  server maps it to a placeholder address before calling `signInWithPassword`, e.g.
  `mgadmin` → `mgadmin@mgbarbers.invalid`. The `.invalid` domain is reserved and can
  never receive mail. The owner never sees the email part.
- The owner account is created by hand in the Supabase dashboard (Authentication → Add
  user, tick "Auto confirm"). Public sign-ups are turned off.
- `requireAdmin()` in `lib/admin-auth.ts` checks that the session user's id matches
  `ADMIN_USER_ID` (server-only env var). It is called inside **every** admin page, route
  handler and server action.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) redirects logged-out `/admin/*`
  requests to `/admin/login` and refreshes the session cookie. This is for convenience
  only; the security check is `requireAdmin()`.
- The password is reset in the Supabase dashboard. Email-based "forgot password" doesn't
  exist, because the address isn't real.
- All admin pages are `noindex`.

---

## 3. Database

### 3.1 New table: `availability_blocks` (#6)

```sql
CREATE TABLE IF NOT EXISTS availability_blocks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date  date        NOT NULL,            -- first blocked day
  end_date    date        NOT NULL,            -- last blocked day (inclusive); = start_date for one day
  start_time  time,                            -- NULL together with end_time = whole day
  end_time    time,                            -- exclusive: 14:00–16:30 blocks the 14:00…16:00 slots
  reason      text,                            -- private note, never shown to customers
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT blocks_date_order CHECK (end_date >= start_date),
  CONSTRAINT blocks_time_pair  CHECK ((start_time IS NULL) = (end_time IS NULL)),
  CONSTRAINT blocks_time_order CHECK (start_time IS NULL OR end_time > start_time),
  -- Times must sit on the 30-minute slot grid (e.g. 14:00 or 14:30, never 14:15)
  CONSTRAINT blocks_slot_grid  CHECK (
    start_time IS NULL OR (
      EXTRACT(MINUTE FROM start_time) IN (0, 30) AND EXTRACT(SECOND FROM start_time) = 0 AND
      EXTRACT(MINUTE FROM end_time)   IN (0, 30) AND EXTRACT(SECOND FROM end_time)   = 0
    )
  )
);

-- Availability queries ask "which blocks overlap [from, to]?":
--   WHERE start_date <= :to AND end_date >= :from
CREATE INDEX IF NOT EXISTS idx_blocks_dates ON availability_blocks (start_date, end_date);
```

| Example | start_date | end_date | start_time | end_time |
|---|---|---|---|---|
| Holiday, 20–27 Dec | 2026-12-20 | 2026-12-27 | NULL | NULL |
| Dentist, Tue 14:00–15:30 | 2026-10-20 | 2026-10-20 | 14:00 | 15:30 |
| Mornings off all next week | 2026-10-26 | 2026-10-30 | 10:00 | 12:00 |
| Block the last slot of the day | 2026-10-21 | 2026-10-21 | 19:00 | 19:30 |

- `end_time` is exclusive, so blocking the 19:00 slot needs `end_time = 19:30`. The admin
  UI lets the owner pick slots ("from 14:00 up to and including 15:00") and computes
  `end_time` itself.
- Opening hours are not enforced in the database. They stay in code (`ALL_TIMES`), so
  changing them never needs a migration.
- Blocks are created and deleted, never edited, so there's no `updated_at` column.

### 3.2 Changes to `appointments` (#9)

```sql
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online'
  CHECK (source IN ('online', 'admin'));
```

`source = 'admin'` marks manual bookings, which send no emails.

### 3.3 Row Level Security (#4, and #6 for the new table)

The server switches to a server-only `SUPABASE_SERVICE_ROLE_KEY` for all database access,
then RLS is enabled with no policies, so the anon key can read nothing.

> ⚠️ **Order matters.** Deploy the service-role code change first, then run this SQL.
> Running it first breaks the live site, because the current code uses the anon key.

```sql
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon/authenticated roles get nothing; the service role bypasses RLS.
```

All SQL is also added to `supabase-schema.sql` by the ticket that introduces it.

---

## 4. Availability logic

### 4.1 One shared helper (#2)

`lib/availability.ts` exports `getBlockedSlots({ from, to, userArea })`. It fetches
appointments (and, from #6, blocks) for the window and calls `computeBlockedSlots`.
`booked-slots`, `validate-postcode` and `book-appointment` all use it. This replaces three
separate calculations that have drifted apart: `booked-slots` currently fetches every
appointment ever, and `validate-postcode` skips travel buffers.

### 4.2 Blocks in the slot rules (#6, [lib/slots.ts](lib/slots.ts))

- New `BookedSlot.kind`: `"unavailable"`. Customers see it the same as a booked slot.
- Precedence when a slot qualifies more than once: booked > unavailable > buffer.
- **No travel buffers around blocks.** A block has no location; the owner sets the window
  wide enough to cover his own travel.
- A Haircut + Shave can't start in the slot just before a block (same rule as running into
  a booked slot).
- Blocks are reason-only on the admin side; the reason never leaves the admin API.

### 4.3 Booking validation fixes (#3)

- "Today" and "now" are computed in `Europe/London` on the server (`lib/time.ts`).
- On today's date, slots at or before the current time are unavailable (UI and server).
- The server rejects dates in the past and beyond the 14-day window.
- Check + insert runs in a Postgres function (`book_appointment`, called via `rpc`). It takes
  an advisory lock on the date, so two simultaneous bookings for the same slot can't both
  succeed. A race on travel *buffers* alone remains possible and is accepted at this volume.

---

## 5. Admin UI (mobile-first)

```
/admin/login          Username + password
/admin                Agenda (#8): today + upcoming, grouped by day
                        card: time range, service, name, phone (tel: link),
                        address + postcode (Google Maps link), email if given
/admin/schedule       Month calendar (#7); tap a day → bottom sheet:
                        that day's appointments (read-only) and blocks ([Delete])
                        [Block whole day] [Block time range] [Block several days]
                        optional private reason
/admin/bookings/new   Manual booking (#9): postcode → service → date/time → details
                        same availability rules as customers, no override, no emails
```

**Blocking over an existing appointment:** warn and allow. The dialog shows "N
appointments fall in this block" with the list, plus [Block anyway] and [Back]. The
appointments stay as they are, and the owner deals with them off-platform.

Touch targets are at least 44px, with no horizontal scrolling at 375px width.

---

## 6. Admin API

Every handler calls `requireAdmin()` first and returns 401 without a valid owner session.

| Method | Route | Purpose | Ticket |
|---|---|---|---|
| GET | `/api/admin/blocks?from&to` | List blocks in a window | #6 |
| POST | `/api/admin/blocks` | Create a block. If appointments overlap and `force` isn't set, returns `409 { conflicts }` and saves nothing | #6 |
| DELETE | `/api/admin/blocks/:id` | Delete a block | #6 |
| GET | `/api/admin/appointments?from&to` | Agenda | #8 |
| POST | `/api/admin/appointments` | Manual booking: same validation as the public route, `source = 'admin'`, no emails | #9 |

The public and admin booking routes share one validation and insert function, so their
rules can't drift apart.

---

## 7. Environment variables (new)

| Var | Ticket | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | #4 | Server-only. Never given a public prefix; `lib/supabase.ts` imports `server-only` |
| `ADMIN_USER_ID` | #5 | The owner's Supabase user id |

Both go in `.env.example` (as placeholders), `.env.local`, the hosting provider's settings
and `CLAUDE.md`.

---

## 8. Still to decide

- **Required fields for manual bookings (#9).** Proposal: name, postcode and address
  required; phone and email optional. An optional phone needs
  `ALTER TABLE appointments ALTER COLUMN phone DROP NOT NULL;`. The public booking form
  still requires a phone number.
