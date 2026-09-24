import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  biometricName: string; // 'Face ID', 'Touch ID', 'Fingerprint', or 'Biometrics'
}

export const getBiometricSupport = async (): Promise<BiometricStatus> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricName = 'Biometrics';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricName = 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricName = 'Fingerprint / Touch ID';
    }

    return {
      available: hasHardware,
      enrolled: isEnrolled,
      biometricName,
    };
  } catch (e) {
    return {
      available: false,
      enrolled: false,
      biometricName: 'Biometrics',
    };
  }
};

export const authenticateWithBiometrics = async (
  promptMessage: string = 'Authenticate with WelliPay'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { available, enrolled } = await getBiometricSupport();
    if (!available || !enrolled) {
      return { success: false, error: 'Biometrics not enrolled on device.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use App PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Authentication cancelled' };
    }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Biometric scan failed' };
  }
};
