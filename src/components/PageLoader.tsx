// Full-area spinner while a guard decides (session / permission). role="status" for screen readers.
export default function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state-box" role="status" aria-busy="true">
      <i className="state-box-icon pi pi-spin pi-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
