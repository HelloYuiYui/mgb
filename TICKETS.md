# Admin Panel — Ticket Drafts

Drafts for GitHub issues, derived from [ADMIN_PLAN.md](ADMIN_PLAN.md) (section refs like §4.1
point there). Order = suggested implementation order; each ticket lists what it depends on.

| # | Title | Depends on | Size |
|---|---|---|---|
| 1 | Add Vitest and cover slot logic | — | S |
| 2 | Consolidate availability into `lib/availability.ts` | 1 | M |
| 3 | Harden booking validation (past/out-of-window, timezone, double-booking) | 2 | M |
| 4 | Service-role key + Row Level Security | — | S |
| 5 | Admin authentication (username + password) | 4 | M |
| 6 | Availability blocks: table, slot logic, admin API | 2, 5 | M |
| 7 | Admin schedule UI (`/admin/schedule`) | 6 | L |
| 8 | Admin agenda UI (`/admin`) | 5 | S |
| 9 | Manual booking (`/admin/bookings/new`) | 3, 5 | M |
| 10 | *(Later)* Admin cancellation | 8 | M |
| 11 | *(Later)* Weekly hours + settings | 6 | L |

Suggested labels: `admin`, `backend`, `frontend`, `security`, `refactor`, `testing`, `later`.

---

## #1 Add Vitest and cover slot logic

**Labels:** `testing` · **Depends on:** — · **Size:** S

**Why:** [lib/slots.ts](lib/slots.ts) is the most logic-heavy file and has no tests. Tickets
2, 3 and 6 all change it, so we want a safety net first.

**Tasks**
- Add `vitest` as a dev dependency and an `npm test` script.
- `lib/slots.test.ts` covering `occupiedTimes`, `computeBlockedSlots`, `isStartTimeAvailable`.
  Use a stub `getTravelTime` so tests don't depend on the Dijkstra graph.

**Acceptance criteria**
- [ ] `npm test` runs and passes locally.
- [ ] Covered cases: a haircut occupies 1 slot; a haircut+shave occupies 2; a shave at 19:00
      occupies 1 (overrun); a buffer before and after a far haircut; a buffer only before a
      far shave; no buffers at ≤15 min; no buffers without a user area; booked takes
      precedence over buffer; a shave can't start before a booked slot but can start before
      a buffer slot.
- [ ] No production code changes.

---

## #2 Consolidate availability into `lib/availability.ts`

**Labels:** `refactor`, `backend` · **Depends on:** #1 · **Size:** M

**Why:** availability is computed three different ways (§4.1). `booked-slots` fetches
every appointment ever, and `validate-postcode` skips travel buffers. Blocks (#6) should only
need adding in one place.

**Tasks**
- Create `getBlockedSlots({ from, to, userArea })` in `lib/availability.ts`: fetch
  appointments in `[from, to]`, map rows, call `computeBlockedSlots`.
- Use it in `booked-slots`, `validate-postcode` and `book-appointment`.
- Move the duplicated row-mapping (`appointment_time.slice(0, 5)`, the `service` default)
  into the helper.

**Acceptance criteria**
- [ ] All three routes call `getBlockedSlots`; none query `appointments` for availability directly.
- [ ] `booked-slots` only fetches today … today + 14 days.
- [ ] `validate-postcode` now returns travel buffers too. Check that the calendar still
      shows the same days as available or full (the booking page re-fetches from
      `booked-slots` anyway).
- [ ] `npm test`, `npm run lint`, `npm run build` pass; a manual booking through the UI still works.

---

## #3 Harden booking validation

**Labels:** `backend`, `frontend`, `security` · **Depends on:** #2 · **Size:** M

**Why:** gaps listed in §4.3. Past slots can be booked, the server accepts any date, "today" is
computed in UTC, and two simultaneous bookings for the same slot can both succeed.

**Tasks**
- Add a `lib/time.ts` helper for "today" and "now" in `Europe/London`. Use it everywhere
  the server builds dates.
- `TimeSlots`: on today's date, disable slots at or before the current time.
- `book-appointment`: reject (400) dates in the past, past times today, and dates beyond
  the 14-day window.
- Double-booking: move check + insert into a Postgres function (`book_appointment`, called
  via `rpc`). It takes `pg_advisory_xact_lock` on the date, re-checks that neither of the
  slots the new booking would occupy is already taken, then inserts. Return 409 on
  conflict. Add the SQL to `supabase-schema.sql`.

**Acceptance criteria**
- [ ] A past slot today shows as unavailable in the UI, and a direct POST for it returns 400.
- [ ] A POST for a date 15+ days out, or yesterday, returns 400.
- [ ] Two concurrent POSTs for the same slot: exactly one succeeds and the other gets 409.
      Test with a small script firing both at once.
- [ ] A shave booked at 14:00 and a haircut at 14:30 sent concurrently: one gets 409.
- [ ] Known limitation, documented in the code: travel *buffers* are still checked in
      TypeScript before the RPC, so a buffer-only race is possible. That's acceptable at
      this volume.

---

## #4 Service-role key + Row Level Security

**Labels:** `security`, `backend` · **Depends on:** — · **Size:** S

**Why:** if RLS is off, anyone with the anon key can read every customer's name, phone and
address (§3.3). The admin panel also needs a privileged server-side client.

**Tasks**
- Add `SUPABASE_SERVICE_ROLE_KEY` (server-only, no public prefix) to `.env.example`, and to
  `.env.local` and the hosting provider's settings by hand.
- `lib/supabase.ts`: create the client with the service-role key. Add a short comment saying
  it must never be imported into client components (consider `import "server-only"`).
- **Deploy that first**, then run the RLS SQL from §3.3 in the Supabase SQL editor.
- Update `CLAUDE.md` (env vars).

**Acceptance criteria**
- [ ] Booking, calendar availability and postcode validation all still work with RLS enabled.
- [ ] A request with only the anon key (e.g. curl to the Supabase REST endpoint) returns
      no appointment rows.
- [ ] `grep` of the client bundle (`.next/static`) doesn't contain the service-role key.
- [ ] RLS migration SQL added to `supabase-schema.sql`.

---

## #5 Admin authentication (username + password)

**Labels:** `admin`, `security`, `backend`, `frontend` · **Depends on:** #4 · **Size:** M

**Why:** nothing admin-related can ship without it (§2).

**Tasks**
- **Spike first (≤30 min):** confirm that Supabase Auth accepts a user with email
  `mgadmin@mgbarbers.invalid` created in the dashboard with "Auto confirm". If not, switch
  to the fallback (an `admin_users` table with a bcrypt hash plus a `jose`-signed
  cookie) and note it on this ticket.
- Install `@supabase/ssr`; add a cookie-based server client for auth (separate from the
  service-role data client).
- `/admin/login`: username + password form. Username maps to `<username>@mgbarbers.invalid`
  server-side. Show a generic error ("Incorrect username or password").
- `lib/admin-auth.ts`: `requireAdmin()` gets the session user and checks
  `user.id === process.env.ADMIN_USER_ID`. If not, it redirects (pages) or returns 401 (API).
- `proxy.ts`: redirect unauthenticated `/admin/*` (except `/admin/login`) to the login page,
  and refresh the session cookie.
- Logout button; `noindex` on all admin pages; disable public sign-ups in Supabase settings.
- Add `ADMIN_USER_ID` to `.env.example`; document user creation and password reset in `CLAUDE.md`.

**Acceptance criteria**
- [ ] Logged out: `/admin` redirects to `/admin/login`.
- [ ] Logged out: `/api/admin/*` returns 401 **even when the proxy is bypassed**. Test by
      calling the handler with no cookie.
- [ ] Wrong password: generic error, no hint about whether the username exists.
- [ ] Logged in: session survives a page refresh and closing and reopening the mobile
      browser. Logout clears it.
- [ ] A different Supabase user (if one existed) is rejected by `requireAdmin()`.

---

## #6 Availability blocks: table, slot logic, admin API

**Labels:** `admin`, `backend` · **Depends on:** #2, #5 · **Size:** M

**Why:** the core feature. The owner can block whole days, date ranges and time windows
without faking appointments.

**Tasks**
- Run the `availability_blocks` SQL (§3.1) and add it to `supabase-schema.sql`. Enable RLS
  on it (§3.3).
- Types: `AvailabilityBlock` in `lib/types.ts`; add `"unavailable"` to `BookedSlot.kind`.
- `computeBlockedSlots`: accept blocks and expand them to slots within the window.
  Precedence: booked > unavailable > buffer. No travel buffers around blocks.
- `isStartTimeAvailable`: a shave can't start if the next slot is `unavailable`.
- `getBlockedSlots` fetches overlapping blocks (`start_date <= to AND end_date >= from`).
- Admin API (all behind `requireAdmin()`):
  - `GET /api/admin/blocks?from&to`
  - `POST /api/admin/blocks`. Validate dates and times on the 30-min grid. If confirmed
    appointments overlap and `force` isn't set, return `409 { conflicts: [...] }`.
    With `force: true`, save anyway.
  - `DELETE /api/admin/blocks/:id`
- Customer UI: treat `unavailable` exactly like `booked` (`Calendar`, `TimeSlots`).

**Acceptance criteria**
- [ ] Unit tests: a whole-day block, a date-range block, a time-window block (including
      the exclusive end time), a shave before a block is refused, precedence order.
- [ ] A whole-day block makes that day show as fully booked in the customer calendar.
- [ ] Blocking 14:00–15:30 makes the 14:00, 14:30 and 15:00 slots unavailable; 15:30 stays open.
- [ ] `book-appointment` returns 409 for a blocked slot (server-side, not just the UI).
- [ ] POST over an existing appointment without `force` returns the conflict list and saves
      nothing. With `force`, it saves the block and leaves the appointment untouched.
- [ ] All admin endpoints return 401 when logged out.

---

## #7 Admin schedule UI (`/admin/schedule`)

**Labels:** `admin`, `frontend` · **Depends on:** #6 · **Size:** L

**Why:** the owner's main screen for managing availability, used on a phone.

**Tasks**
- Month calendar (prev/next month). Each day shows indicators for whole-day blocked,
  partly blocked, and number of appointments.
- Tap a day to open a bottom sheet with:
  - the day's appointments (read-only) and existing blocks, each with a [Delete] button
    and a confirmation step;
  - [Block whole day];
  - [Block time range]: from/to pickers that use slot times. The "to" picker means "up to
    and including the slot", and the UI turns that into the exclusive `end_time`;
  - [Block several days]: an end-date picker, plus an optional time range applied to
    every day.
- Optional private reason field.
- Conflict warning dialog: "N appointments fall in this block" with a list, plus
  [Block anyway] (retries with `force: true`) and [Back].
- Built with the mobile Tailwind styles; reuse `Calendar` if it generalises cleanly,
  otherwise build a separate `AdminMonthCalendar`.

**Acceptance criteria**
- [ ] All four block shapes in §3.1's table can be created from the UI at 375px width.
- [ ] Deleting a block asks for confirmation and updates the view without a full reload.
- [ ] The conflict dialog appears when blocking over an appointment; [Block anyway] saves.
- [ ] A new block is immediately reflected on the customer booking page.
- [ ] Touch targets ≥44px; no horizontal scroll on mobile.

---

## #8 Admin agenda UI (`/admin`)

**Labels:** `admin`, `frontend`, `backend` · **Depends on:** #5 · **Size:** S

**Why:** the owner needs to see who he's visiting and when, without opening Supabase.

**Tasks**
- `GET /api/admin/appointments?from&to` (behind `requireAdmin()`), or a server component
  that fetches directly.
- `/admin`: today plus upcoming appointments, grouped by day. Each card shows the time
  range (two slots for a shave), service, name, phone as a `tel:` link, address and
  postcode as a Google Maps link, and email if given.
- Empty state; nav links to Schedule and New booking; logout.

**Acceptance criteria**
- [ ] Appointments are listed in chronological order, grouped by day, starting today.
- [ ] Tapping the phone number starts a call; tapping the address opens Maps on mobile.
- [ ] Past appointments are not shown (or are collapsed under "Earlier today").
- [ ] Customer-entered text is rendered safely (no raw HTML).

---

## #9 Manual booking (`/admin/bookings/new`)

**Labels:** `admin`, `frontend`, `backend` · **Depends on:** #3, #5 · **Size:** M

**Why:** bookings taken by phone or in person should block the calendar properly,
including travel buffers.

**⚠️ Needs decision first (§8):** which fields are required? The proposal is name,
postcode and address required, phone optional, email optional. An optional phone needs
`ALTER TABLE appointments ALTER COLUMN phone DROP NOT NULL;`.

**Tasks**
- Run the `source` column SQL (§3.2) and add it to `supabase-schema.sql`.
- Pull the validation and insert logic out of `book-appointment` into a shared function, so
  the public and admin routes can't drift apart.
- `POST /api/admin/appointments` (behind `requireAdmin()`): same validation and
  availability rules as the public route, inserts `source = 'admin'`, **sends no emails**.
- Page: postcode, then service, then date/time (reusing `Calendar`/`TimeSlots` with
  availability for that postcode), then details (reusing `DetailsForm` fields, with the
  required fields as decided above).

**Acceptance criteria**
- [ ] A manual booking appears in the agenda and blocks the slot (and buffers) for customers.
- [ ] No emails are sent for admin bookings.
- [ ] Unavailable slots can't be picked; the server returns 409 for them as well.
- [ ] Public bookings still insert `source = 'online'` and still send emails.

---

## #10 *(Later)* Admin cancellation

**Labels:** `admin`, `later` · **Depends on:** #8

- `status` (`confirmed`/`cancelled`) and `cancelled_at` columns. Availability only counts
  `confirmed`.
- [Cancel] on agenda cards, with a confirmation and an "Email the customer" checkbox
  (ticked by default, hidden if there's no email).
- Cancellation email template in `lib/email.ts`.
- "Block and cancel these" option in the #7 conflict dialog.

## #11 *(Later)* Weekly hours + settings

**Labels:** `admin`, `later` · **Depends on:** #6

- `weekly_hours` table (`day_of_week`, `open_time`, `close_time`; no row = closed) replacing the hardcoded 10:00–19:00 per weekday.
- Settings: booking horizon (currently 14 days), minimum notice, day start/end.
- Admin UI for both.
