/**
 * Custom error types and error handling utilities.
 * Provides structured error context and categorization.
 */

export enum ErrorType {
	DATABASE = "DATABASE",
	EXTERNAL_API = "EXTERNAL_API",
	VALIDATION = "VALIDATION",
	STARTUP = "STARTUP",
	UNKNOWN = "UNKNOWN",
}

export interface ErrorContext {
	type: ErrorType;
	retryable: boolean;
	statusCode?: number;
	originalError?: Error;
	[key: string]: any;
}

export class ApplicationError extends Error {
	constructor(
		message: string,
		public context: ErrorContext
	) {
		super(message);
		this.name = "ApplicationError";
		Object.setPrototypeOf(this, ApplicationError.prototype);
	}
}

export function createDatabaseError(message: string, originalError?: Error): ApplicationError {
	return new ApplicationError(message, {
		type: ErrorType.DATABASE,
		retryable: true,
		originalError,
	});
}

export function createApiError(
	message: string,
	statusCode?: number,
	originalError?: Error
): ApplicationError {
	return new ApplicationError(message, {
		type: ErrorType.EXTERNAL_API,
		retryable: statusCode !== 401 && statusCode !== 403,
		statusCode,
		originalError,
	});
}

export function createValidationError(message: string, details?: any): ApplicationError {
	return new ApplicationError(message, {
		type: ErrorType.VALIDATION,
		retryable: false,
		details,
	});
}

export function createStartupError(message: string, originalError?: Error): ApplicationError {
	return new ApplicationError(message, {
		type: ErrorType.STARTUP,
		retryable: false,
		originalError,
	});
}

export function isApplicationError(error: any): error is ApplicationError {
	return error instanceof ApplicationError;
}

export function isRetryable(error: any): boolean {
	if (isApplicationError(error)) {
		return error.context.retryable;
	}
	return false;
}

export function getErrorContext(error: any): Partial<ErrorContext> {
	if (isApplicationError(error)) {
		const { type, retryable, statusCode } = error.context;
		return { type, retryable, statusCode };
	}
	return { type: ErrorType.UNKNOWN, retryable: false };
}
