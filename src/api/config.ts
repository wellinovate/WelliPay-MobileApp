// The wellipay-api service this app talks to — the same backend
// WelliPayPro (the provider-facing web app) uses, per Wins's decision to
// keep one backend/database rather than standing up a separate one for
// the Patient MobileApp. Override via EXPO_PUBLIC_WELLIPAY_API_URL for a
// local dev server.
export const WELLIPAY_API_URL =
  process.env.EXPO_PUBLIC_WELLIPAY_API_URL || 'https://wellipay-api.onrender.com';
