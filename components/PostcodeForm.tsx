"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ValidatePostcodeResponse } from "@/lib/types";

/** Postcode input form with client-side and server-side validation. */
export default function PostcodeForm() {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Client-side validation: starts with G, exactly 6 chars (no spaces). */
  function isValidPostcode(value: string): boolean {
    const cleaned = value.replace(/\s/g, "").toUpperCase();
    return cleaned.length === 6 && cleaned.startsWith("G");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleaned = postcode.replace(/\s/g, "").toUpperCase();
    if (!isValidPostcode(cleaned)) {
      setError("Please enter a valid Glasgow postcode (e.g. G1 1AA).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/validate-postcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: cleaned }),
      });

      const data: ValidatePostcodeResponse = await res.json();

      if (!data.valid) {
        setError(data.error ?? "Invalid postcode.");
        return;
      }

      // Store postcode and booked slots for the booking page
      sessionStorage.setItem("mgb_postcode", cleaned);
      sessionStorage.setItem("mgb_booked_slots", JSON.stringify(data.bookedSlots));
      router.push("/booking");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
          Enter your postcode
        </label>
        <input
          id="postcode"
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. G1 1AA"
          maxLength={7}
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
        {loading ? "Checking..." : "Find available times"}
      </button>
    </form>
  );
}
