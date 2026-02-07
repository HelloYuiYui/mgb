"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import DetailsForm from "@/components/DetailsForm";

/** Personal details page — final step before booking confirmation. */
export default function DetailsPage() {
  const router = useRouter();

  // Guard: redirect if session data is missing
  useEffect(() => {
    const postcode = sessionStorage.getItem("mgb_postcode");
    const date = sessionStorage.getItem("mgb_date");
    const time = sessionStorage.getItem("mgb_time");

    if (!postcode || !date || !time) {
      router.replace("/");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <Header title="Your details" subtitle="Please fill in your details to finalise the booking." />
      <DetailsForm />
    </main>
  );
}
