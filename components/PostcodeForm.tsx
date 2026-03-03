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

  /** Client-side validation: Glasgow postcode, 5 or 6 alphanumeric chars (no spaces). */
  function isGlasgowPostcode(value: string): boolean {
    return /^G[A-Z0-9]{1,2}[A-Z0-9]{3}$/.test(value);
  }

  function isInServiceArea(value: string): boolean {
    const prefix = value.slice(0, -3);
    return ["G51", "G52", "G53", "G46", "G43",
    "G41", "G42", "G44", "G45", "G73",
    "G5", "G11", "G12", "G22", "G20",
    "G21", "G31", "G32", "G33", "G34",
    "G69", "G71", "G72", "G74", "G75", 
    "G40", "G1", "G2", "G3", "G4", 
    "ML3", "ML1", "ML4", "ML5" // Motherwell
    ].includes(prefix);
  }

  /** Normalise to "GX XXX" or "GXX XXX" (space before last 3 characters). */
  function formatPostcode(value: string): string {
    return value.slice(0, -3) + " " + value.slice(-3);
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");

    const cleaned = postcode.replace(/\s/g, "").toUpperCase();
    if (!isGlasgowPostcode(cleaned) && !isInServiceArea(cleaned)) {
        setError(isGlasgowPostcode(cleaned) ? "Unfortunately your postcode is outside our service area." : "Please enter a valid Glasgow postcode (e.g. G1 1AA).");
        return;
    }
    const formatted = formatPostcode(cleaned);

    setLoading(true);
    try {
      const res = await fetch("/api/validate-postcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: formatted }),
      });

      const data: ValidatePostcodeResponse = await res.json();

      if (!data.valid) {
        setError(data.error ?? "Invalid postcode.");
        return;
      }

      // Store postcode and booked slots for the booking page
      sessionStorage.setItem("mgb_postcode", formatted);
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
          maxLength={8}
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
