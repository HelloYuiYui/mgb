import Header from "@/components/Header";
import PostcodeForm from "@/components/PostcodeForm";

/** Book page — postcode entry point for the booking flow. */
export default function BookPage() {
  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-12">
      <Header
        title="Book an appointment"
        subtitle="Enter your postcode to check availability in your area."
      />
      <PostcodeForm />
    </main>
  );
}
