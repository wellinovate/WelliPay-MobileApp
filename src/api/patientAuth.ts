import { patientApiRequest, ApiError } from './client';
import { savePatientToken, clearPatientToken } from '../auth/patientSession';

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// First-time linking: the patient types the reference and amount printed
// on their bill (see wellipay-api/src/schemas/patientAuth.ts for why this
// is a lightweight check, not strong identity proofing — the real
// safeguard is that the caller already holds a verified Clerk session).
export async function linkPatientAccount(
  clerkSessionToken: string,
  invoiceRef: string,
  amountMinor: number
): Promise<void> {
  const result = await patientApiRequest<AccessTokenResponse>('/patient/link', {
    method: 'POST',
    skipPatientAuth: true,
    authorizationOverride: `Bearer ${clerkSessionToken}`,
    body: { invoiceRef, amountMinor },
  });
  await savePatientToken(result.access_token, result.expires_in);
}

// Subsequent app opens: already linked, just trade a fresh Clerk session
// for a fresh WelliPay-issued patient token. Returns false (rather than
// throwing) for the expected "not linked yet" case, so callers can route
// to the linking screen without a try/catch for the common path.
export async function refreshPatientToken(clerkSessionToken: string): Promise<boolean> {
  try {
    const result = await patientApiRequest<AccessTokenResponse>('/patient/token', {
      method: 'POST',
      skipPatientAuth: true,
      authorizationOverride: `Bearer ${clerkSessionToken}`,
    });
    await savePatientToken(result.access_token, result.expires_in);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return false; // not_linked — expected for a first-time user
    }
    throw err;
  }
}

export async function signOutPatientAccount(): Promise<void> {
  await clearPatientToken();
}
