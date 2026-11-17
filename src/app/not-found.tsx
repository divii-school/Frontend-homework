import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo, ErrorState } from "@/components";
import { DEFAULT_HOME } from "@/config/navigation";

export const metadata: Metadata = { title: "Page not found" };

// App-level 404 (unknown URL, or notFound() from a page).
export default function NotFound() {
  return (
    <main className="full-page">
      <section className="error-page-card">
        <div className="error-page-brand">
          <BrandLogo suffix="Admin" />
        </div>
        <ErrorState
          variant="not-found"
          titleAs="h1"
          title="Page not found"
          message="The page you are looking for does not exist or has moved."
          actions={
            <Link href={DEFAULT_HOME} className="p-button p-component">
              <span className="p-button-label">Go to Product Management</span>
            </Link>
          }
        />
      </section>
    </main>
  );
}
