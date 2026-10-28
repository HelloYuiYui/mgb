// Fires two booking requests at the same moment to check the double-booking guard.
//
// Usage:
//   node scripts/concurrent-booking.mjs <base-url> <date> <timeA> [serviceA] [timeB] [serviceB]
//
// Examples (against `pnpm dev`):
//   Same slot, expect one 200 and one 409:
//     node scripts/concurrent-booking.mjs http://localhost:3000 2026-10-30 14:00
//   Shave at 14:00 vs haircut at 14:30, expect one 200 and one 409:
//     node scripts/concurrent-booking.mjs http://localhost:3000 2026-10-30 14:00 haircut_shave 14:30 haircut
//
// This creates real appointments: run it against a test database or delete the rows afterwards.

const [baseUrl, date, timeA, serviceA = "haircut", timeB = timeA, serviceB = "haircut"] =
  process.argv.slice(2);

if (!baseUrl || !date || !timeA) {
  console.error("Usage: node scripts/concurrent-booking.mjs <base-url> <date> <timeA> [serviceA] [timeB] [serviceB]");
  process.exit(1);
}

function book(label, time, service) {
  return fetch(`${baseUrl}/api/book-appointment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Concurrency test ${label}`,
      phone: "07700900000",
      address: "1 Test Street",
      postcode: "G1 1AA",
      service,
      appointment_date: date,
      appointment_time: time,
    }),
  }).then(async (res) => ({ label, time, service, status: res.status, body: await res.json() }));
}

const results = await Promise.all([book("A", timeA, serviceA), book("B", timeB, serviceB)]);
for (const r of results) {
  console.log(`${r.label} ${r.service} @ ${r.time}: ${r.status}`, r.body.error ?? "");
}

const statuses = results.map((r) => r.status).sort();
const ok = statuses[0] === 200 && statuses[1] === 409;
console.log(ok ? "PASS: exactly one booking succeeded" : `FAIL: got ${statuses.join(", ")}`);
process.exit(ok ? 0 : 1);
