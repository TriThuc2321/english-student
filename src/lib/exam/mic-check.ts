const key = (attemptId: string) => `mic-check:${attemptId}`;

// Per tab session, so a reload mid-attempt doesn't ask again but a new day does.
export function hasCheckedMic(attemptId: string): boolean {
  try {
    return sessionStorage.getItem(key(attemptId)) !== null;
  } catch {
    return false;
  }
}

export function rememberMicCheck(attemptId: string) {
  try {
    sessionStorage.setItem(key(attemptId), '1');
  } catch {
    // Without storage the check is simply asked again after a reload.
  }
}
