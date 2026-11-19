import EmptyState from "./EmptyState";

interface ComingSoonProps {
  /** Route + query this page will handle, shown as a hint for the screen work. */
  route: string;
  details?: string[];
}

// Placeholder body for routes whose screen is not built yet (foundation only).
export default function ComingSoon({ route, details = [] }: ComingSoonProps) {
  return (
    <section className="content-card" aria-label="준비 중">
      <EmptyState
        icon="pi pi-wrench"
        title="준비 중"
        description="이 화면은 HW3 범위에 포함되며 곧 제공될 예정입니다."
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
