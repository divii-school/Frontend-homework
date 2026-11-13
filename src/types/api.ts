/** Every Talking Club API response uses this envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  statusCode: number;
  timestamp?: string;
  path?: string;
}
