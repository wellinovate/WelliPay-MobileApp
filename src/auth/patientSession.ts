import * as SecureStore from 'expo-secure-store';

// The WelliPay-issued patient access token (from POST /patient/link or
// /patient/token — see src/api/patientAuth.ts), kept separate from Clerk's
// own session (Clerk's tokenCache.ts already manages that one). This is
// the token every wellipay-api /patient/* call sends as its bearer token.
const PATIENT_TOKEN_KEY = 'wellipay_patient_access_token';
const PATIENT_TOKEN_EXPIRES_AT_KEY = 'wellipay_patient_access_token_expires_at';

export interface StoredPatientToken {
  token: string;
  expiresAt: number; // ms since epoch
}

export async function savePatientToken(token: string, expiresInSeconds: number): Promise<void> {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  await SecureStore.setItemAsync(PATIENT_TOKEN_KEY, token);
  await SecureStore.setItemAsync(PATIENT_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
}

export async function getStoredPatientToken(): Promise<StoredPatientToken | null> {
  const [token, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(PATIENT_TOKEN_KEY),
    SecureStore.getItemAsync(PATIENT_TOKEN_EXPIRES_AT_KEY),
  ]);
  if (!token || !expiresAtRaw) return null;
  return { token, expiresAt: Number(expiresAtRaw) };
}

// A small safety margin so a call doesn't start with a token that expires
// mid-flight — the token is short-lived (15 min, see wellipay-api's
// issueAccessToken default) so this matters more here than it would for a
// long-lived session.
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

export async function getValidPatientToken(): Promise<string | null> {
  const stored = await getStoredPatientToken();
  if (!stored) return null;
  if (stored.expiresAt - EXPIRY_SAFETY_MARGIN_MS < Date.now()) return null;
  return stored.token;
}

export async function clearPatientToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PATIENT_TOKEN_KEY);
  await SecureStore.deleteItemAsync(PATIENT_TOKEN_EXPIRES_AT_KEY);
}
