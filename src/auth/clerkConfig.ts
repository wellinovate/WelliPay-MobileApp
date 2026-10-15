/**
 * Clerk configuration for the WelliPay mobile app.
 * Linked to application: Wellipay (app_3JpIKr4wka6Fcs0UcpwviZe2UFg)
 *
 * The publishable key comes from EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Expo reads
 * it at build time, so set it in the EAS environment for each build profile.
 *
 * Only a development run (Metro, a development client) may fall back to the
 * development-instance key below. A preview or production build without the
 * variable fails at launch with a clear message. Before, it signed patients in
 * on the development instance without saying so.
 */
const DEVELOPMENT_INSTANCE_KEY =
  'pk_test_cHJlY2lvdXMtbW9uYXJjaC0zMTk5LmNsZXJrLmFjY291bnRzLmRldiQ';

const configuredKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!configuredKey && !__DEV__) {
  throw new Error(
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set for this build. Set it in the EAS environment for this build profile and build again.'
  );
}

export const CLERK_PUBLISHABLE_KEY = configuredKey || DEVELOPMENT_INSTANCE_KEY;
