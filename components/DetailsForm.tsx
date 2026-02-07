"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookAppointmentPayload, BookAppointmentResponse } from "@/lib/types";

/** Personal details form — collects name, phone, email, and address. */
export default function DetailsForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate British phone number format
    const cleanedPhone = phone.trim().replace(/\s/g, "");
    if (!/^(?:\+447\d{9}|07\d{9}|7\d{9})$/.test(cleanedPhone)) {
      setError("Please enter a valid UK mobile number (e.g. 07123 456789).");
      return;
    }

    const postcode = sessionStorage.getItem("mgb_postcode");
    const date = sessionStorage.getItem("mgb_date");
    const time = sessionStorage.getItem("mgb_time");

    if (!postcode || !date || !time) {
      setError("Session data missing. Please start from the beginning.");
      router.replace("/");
      return;
    }

    setLoading(true);
    try {
      const payload: BookAppointmentPayload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        postcode,
        appointment_date: date,
        appointment_time: time,
      };

      const res = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: BookAppointmentResponse = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to book appointment.");
        return;
      }

      // Store booking summary for the confirmation page
      sessionStorage.setItem("mgb_booking_name", name.trim());
      router.push("/booking/confirmation");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Smith"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none
                     focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone number <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 07123 456789"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none
                     focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Email (optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. john@example.com"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none
                     focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Full Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Full address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12 Main Street, Glasgow"
          required
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                     placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none
                     focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white
                   shadow-sm transition-colors hover:bg-blue-700 focus:outline-none
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Booking..." : "Confirm booking"}
      </button>
    </form>
  );
}
