export function haptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const hapticLight = () => haptic(10);
export const hapticSync = () => haptic(15);
export const hapticRestDone = () => haptic([50, 30, 50]);
export const hapticSessionSaved = () => haptic([20, 10, 20, 10, 40]);
