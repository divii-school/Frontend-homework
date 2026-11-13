import { LogoutButton } from "@/features/auth/LogoutButton";

// Placeholder until the 8.1.0 product list is built.
export default function ProductsPage() {
  return (
    <main style={{ padding: "var(--space-6)" }}>
      <h1>Product Management</h1>
      <p>You are logged in.</p>
      <LogoutButton />
    </main>
  );
}
