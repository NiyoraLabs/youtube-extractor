export function rateLimit(delayMs: number) {
  let lastCall = 0;

  return async function wait() {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < delayMs) {
      await new Promise((res) =>
        setTimeout(res, delayMs - timeSinceLastCall)
      );
    }

    lastCall = Date.now();
  };
}