import { createCategoriesTable } from "./db/categoryRepository";
import { ensureCategoriesSeeded } from "./jobs/categoriesJob";
import { startIngestionJob } from "./jobs/ingestionJob";
import { getErrorContext } from "./utils/errorHandler";
import { logger } from "./utils/logger";

export async function initCategories() {
	await createCategoriesTable();
	await ensureCategoriesSeeded();
}

let isShuttingDown = false;

async function shutdown(reason: string, exitCode: number = 1) {
	if (isShuttingDown) {
		logger.warn("Shutdown already in progress");
		return;
	}

	isShuttingDown = true;
	logger.info(`Shutdown initiated: ${reason}`);

	try {
		// Add graceful shutdown logic here (e.g., close DB connections)
		logger.info("Shutdown completed");
		process.exit(exitCode);
	} catch (error) {
		logger.error("Error during shutdown", error instanceof Error ? error : new Error(String(error)));
		process.exit(1);
	}
}

(async () => {
	try {
		logger.info("Starting application");

		await initCategories();
		logger.info("Categories initialization completed");

		startIngestionJob();
		logger.info("Ingestion job started");

		logger.info("Application startup complete");
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		const errorContext = getErrorContext(error);

		logger.error("Application startup failed", error instanceof Error ? error : new Error(String(error)), {
			...errorContext,
		});

		shutdown(`Startup error: ${errorMsg}`, 1);
	}
})();

process.on("uncaughtException", (error) => {
	logger.error("Uncaught exception", error);
	shutdown("Uncaught exception", 1);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled rejection", new Error(String(reason)));
	shutdown("Unhandled promise rejection", 1);
});

process.on("SIGTERM", () => {
	shutdown("SIGTERM received", 0);
});

process.on("SIGINT", () => {
	shutdown("SIGINT received", 0);
});
