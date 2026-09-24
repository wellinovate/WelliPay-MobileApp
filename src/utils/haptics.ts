import * as Haptics from 'expo-haptics';

export const hapticLight = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // Graceful fallback on unsupported platforms
  }
};

export const hapticMedium = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Graceful fallback
  }
};

export const hapticHeavy = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {
    // Graceful fallback
  }
};

export const hapticSuccess = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // Graceful fallback
  }
};

export const hapticWarning = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    // Graceful fallback
  }
};

export const hapticError = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    // Graceful fallback
  }
};

export const hapticSelection = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (e) {
    // Graceful fallback
  }
};
