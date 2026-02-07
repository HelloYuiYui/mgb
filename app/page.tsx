import Header from "@/components/Header";
import PostcodeForm from "@/components/PostcodeForm";

/** Landing page — postcode entry point. */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Header title="MG Barbers" />
      <PostcodeForm />
    </main>
  );
}
