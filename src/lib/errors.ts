import { ApiError } from "@/services/http";

/** API message codes → text shown to the user. Unknown codes fall back to the API's own message. */
const MESSAGES: Record<string, string> = {
  invalidCredentials: "The ID and password do not match. Please check and try again.",
  Unauthorized: "Your session has ended. Please log in again.",
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    if (error.status === 403) return "You don't have permission to do this.";
    if (error.status === 404) return "The requested item was not found.";
    if (error.status >= 500) return "Something went wrong on the server. Please try again later.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
