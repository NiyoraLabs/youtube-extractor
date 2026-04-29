type RetryOptions = {
	retries?: number;
	baseDelayMs?: number;
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const { retries = 5, baseDelayMs = 500 } = options;

	let attempt = 0;

	while (true) {
		try {
			return await fn();
		} catch (error: any) {
			const status = error?.response?.status;

			const isRetryable =
				!status || // network error
				status === 429 ||
				(status >= 500 && status < 600);

			if (!isRetryable || attempt >= retries) {
				throw error;
			}
			const jitter = Math.random() * 100;
			const delay = baseDelayMs * Math.pow(2, attempt) + jitter;

			console.warn(
				`Retry attempt ${attempt + 1} after ${delay}ms (status: ${status})`
			);

			await new Promise((res) => setTimeout(res, delay));

			attempt++;
		}
	}
}