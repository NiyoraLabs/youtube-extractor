/**
 * Structured logger with context support.
 * Provides consistent logging across the application with optional context metadata.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
	[key: string]: string | number | boolean | undefined;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
}

class Logger {
	private correlationId: string = generateCorrelationId();

	private formatLogEntry(entry: LogEntry): string {
		return JSON.stringify({
			...entry,
			correlationId: this.correlationId,
		});
	}

	private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
		};

		if (error) {
			entry.error = {
				name: error.name,
				message: error.message,
				stack: error.stack,
			};
		}

		const formatted = this.formatLogEntry(entry);

		switch (level) {
			case "error":
				console.error(formatted);
				break;
			case "warn":
				console.warn(formatted);
				break;
			case "info":
				console.info(formatted);
				break;
			case "debug":
				console.debug(formatted);
				break;
		}
	}

	debug(message: string, context?: LogContext): void {
		this.log("debug", message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log("info", message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log("warn", message, context);
	}

	error(message: string, error?: Error, context?: LogContext): void {
		this.log("error", message, context, error);
	}

	setCorrelationId(id: string): void {
		this.correlationId = id;
	}

	getCorrelationId(): string {
		return this.correlationId;
	}
}

export const logger = new Logger();

function generateCorrelationId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
