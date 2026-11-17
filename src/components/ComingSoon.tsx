import EmptyState from "./EmptyState";

interface ComingSoonProps {
  /** Route + query this page will handle, shown as a hint for the screen work. */
  route: string;
  details?: string[];
}

// Placeholder body for routes whose screen is not built yet (foundation only).
export default function ComingSoon({ route, details = [] }: ComingSoonProps) {
  return (
    <section className="content-card" aria-label="Coming soon">
      <EmptyState
        icon="pi pi-wrench"
        title="Coming soon"
        description="This screen is part of HW3 and is being built next."
        action={
          <p className="placeholder-meta">
            <code>{route}</code>
            {details.map((detail) => (
              <code key={detail}>{detail}</code>
            ))}
          </p>
        }
      />
    </section>
  );
}
