import type { ApiError } from "@/types/api";

/** Red box above a form with what the API answered. The form keeps everything the user typed. */
export function ErrorSummary({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return (
    <div className="error-summary" role="alert">
      <i className="pi pi-exclamation-circle" aria-hidden="true" />
      {error.messages.length === 1 ? (
        <p>{error.messages[0]}</p>
      ) : (
        <ul>
          {error.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
