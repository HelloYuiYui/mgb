import { Resend } from "resend";
import type { BookingEmailData } from "./types";
import { SERVICE_LABELS } from "./slots";
import { formatDate } from "./format";

let _resend: Resend | null = null;

interface EmailConfig {
  resend: Resend;
  from: string;
  ownerEmail: string;
}

/**
 * Returns the email config, or null when any env var is missing —
 * the app must keep working in dev without email configured.
 */
function getConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!apiKey || !from || !ownerEmail) {
    console.warn(
      "Email skipped: RESEND_API_KEY, EMAIL_FROM and OWNER_EMAIL must all be set."
    );
    return null;
  }
  if (!_resend) _resend = new Resend(apiKey);
  return { resend: _resend, from, ownerEmail };
}

/** Escapes user-supplied text for safe interpolation into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** A label/value row for the details table in both emails. */
function detailRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;">${valueHtml}</td>
  </tr>`;
}

/**
 * Shared outer wrapper so both emails render consistently on mobile.
 * `preheaderHtml` is hidden in the body but shown by mail clients as the inbox
 * preview line; the trailing filler stops clients appending table text after it.
 */
function emailShell(heading: string, bodyHtml: string, preheaderHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px 16px;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheaderHtml}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
    <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h1>
      ${bodyHtml}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">MG Barbers — mobile barber serving Glasgow &amp; surrounding areas</p>
    </div>
  </body>
</html>`;
}

function customerEmail(booking: BookingEmailData) {
  const name = escapeHtml(booking.name);
  const address = escapeHtml(booking.address);
  const service = SERVICE_LABELS[booking.service];
  const date = formatDate(booking.appointment_date);
  const time = booking.appointment_time;

  const html = emailShell(
    "Booking confirmed!",
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;">Hi ${name}, your appointment with MG Barbers is booked. We'll come to you — no need to travel.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:0 0 16px;">
      ${detailRow("Service", service)}
      ${detailRow("Date", date)}
      ${detailRow("Time", time)}
      ${detailRow("Address", address)}
    </table>`,
    `<p style="margin:0;font-size:14px;color:#374151;">Your ${service} is booked for ${date} at ${time}. We'll come to you — no need to travel.</p>`
  );

  const text = [
    `Hi ${booking.name}, your appointment with MG Barbers is booked.`,
    "",
    `Service: ${service}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Address: ${booking.address}`,
    "",
    "Need to change or cancel? Just reply to this email.",
  ].join("\n");

  return { subject: `Booking confirmed: ${service}, ${date} at ${time}`, html, text };
}

function ownerEmail(booking: BookingEmailData) {
  const service = SERVICE_LABELS[booking.service];
  const date = formatDate(booking.appointment_date);
  const time = booking.appointment_time;
  const phone = escapeHtml(booking.phone);
  const summary = (name: string, postcode: string) =>
    `${name} has booked a ${service} on ${date} at ${time} in ${postcode}.`;
  const summaryHtml = summary(escapeHtml(booking.name), escapeHtml(booking.postcode));

  const html = emailShell(
    "New booking",
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;">${summaryHtml} Their details are below — tap the number to call them.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
      ${detailRow("Name", escapeHtml(booking.name))}
      ${detailRow("Phone", `<a href="tel:${phone}" style="color:#2563eb;">${phone}</a>`)}
      ${detailRow("Email", booking.email ? escapeHtml(booking.email) : "—")}
      ${detailRow("Address", escapeHtml(booking.address))}
      ${detailRow("Postcode", escapeHtml(booking.postcode))}
      ${detailRow("Service", service)}
      ${detailRow("Date", date)}
      ${detailRow("Time", time)}
    </table>`,
    summaryHtml
  );

  const text = [
    summary(booking.name, booking.postcode),
    "",
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email ?? "—"}`,
    `Address: ${booking.address}`,
    `Postcode: ${booking.postcode}`,
    `Service: ${service}`,
    `Date: ${date}`,
    `Time: ${time}`,
  ].join("\n");

  return {
    subject: `New booking: ${service}, ${date} at ${time} (${booking.postcode})`,
    html,
    text,
  };
}

async function sendCustomerConfirmation(config: EmailConfig, booking: BookingEmailData) {
  if (!booking.email) return;
  const { subject, html, text } = customerEmail(booking);
  const { error } = await config.resend.emails.send({
    from: config.from,
    to: booking.email,
    replyTo: config.ownerEmail,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Customer confirmation failed: ${error.message}`);
}

async function sendOwnerNotification(config: EmailConfig, booking: BookingEmailData) {
  const { subject, html, text } = ownerEmail(booking);
  const { error } = await config.resend.emails.send({
    from: config.from,
    to: config.ownerEmail,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Owner notification failed: ${error.message}`);
}

/**
 * Sends the owner notification and (when the customer left an email address)
 * the customer confirmation. Never throws — by the time this runs the booking
 * is already saved, so email failures are logged and swallowed.
 */
export async function sendBookingEmails(booking: BookingEmailData): Promise<void> {
  try {
    const config = getConfig();
    if (!config) return;

    const results = await Promise.allSettled([
      sendOwnerNotification(config, booking),
      sendCustomerConfirmation(config, booking),
    ]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Booking email failed:", result.reason);
      }
    }
  } catch (error) {
    console.error("Booking email failed:", error);
  }
}
