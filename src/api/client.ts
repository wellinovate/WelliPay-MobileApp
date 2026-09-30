import { WELLIPAY_API_URL } from './config';
import { getValidPatientToken, clearPatientToken } from '../auth/patientSession';

// wellipay-api returns RFC 9457 application/problem+json on every error
// (see wellipay-api/src/lib/problem.ts) — this mirrors that shape so a
// caller can show `detail` directly instead of a generic "Something went
// wrong."
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  problem?: ApiProblem;

  constructor(problem: ApiProblem | undefined, status: number, fallbackMessage: string) {
    super(problem?.detail || problem?.title || fallbackMessage);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code;
    this.problem = problem;
  }
}

// Thrown specifically when the stored patient token is missing or expired,
// so callers can route the user back to sign-in/linking rather than
// showing a generic error.
export class NotLinkedError extends Error {
  constructor(message = 'No linked patient account. Sign in and link your WelliRecord first.') {
    super(message);
    this.name = 'NotLinkedError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  // Only /patient/link and /patient/token call the API without an
  // already-issued patient token (they authenticate with a Clerk session
  // token instead, passed by the caller as its own Authorization header).
  skipPatientAuth?: boolean;
  authorizationOverride?: string;
}

export async function patientApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.authorizationOverride) {
    headers.Authorization = options.authorizationOverride;
  } else if (!options.skipPatientAuth) {
    const token = await getValidPatientToken();
    if (!token) {
      throw new NotLinkedError();
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(`${WELLIPAY_API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    throw new ApiError(undefined, 0, err instanceof Error ? err.message : 'Network request failed');
  }

  if (response.status === 401 && !options.skipPatientAuth) {
    // The stored token was rejected outright (not just locally expired) —
    // clear it so the app doesn't keep retrying with a dead token.
    await clearPatientToken();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(data as ApiProblem, response.status, `Request failed with status ${response.status}`);
  }

  return data as T;
}

// A random-enough Idempotency-Key for one write from this device — good
// enough for the 16-128 char window wellipay-api's checkIdempotency()
// requires; this never needs to be cryptographically unpredictable, only
// unique per logical write attempt.
export function newIdempotencyKey(): string {
  return `mobileapp_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}
