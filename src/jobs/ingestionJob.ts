import cron from "node-cron";
import { ingestQuery } from "../modules/youtube/youtube.service";
import { getErrorContext } from "../utils/errorHandler";
import { logger } from "../utils/logger";

const queries = [
  "nigerian comedy skits",
  "afrobeats",
  "lagos vlog",
];

export function startIngestionJob() {
  cron.schedule("*/20 * * * *", async () => {
    logger.info("Ingestion job started");

    try {
      for (const query of queries) {
        try {
          logger.debug("Processing query", { query });
          await ingestQuery(query);
          logger.debug("Query processed successfully", { query });
        } catch (error) {
          const errorContext = getErrorContext(error);
          const logContext: Record<string, string | number | boolean | undefined> = {
            query,
            type: errorContext.type,
            retryable: errorContext.retryable,
            statusCode: errorContext.statusCode,
          };
          logger.error(
            "Failed to process query",
            error instanceof Error ? error : new Error(String(error)),
            logContext
          );
          // Continue with next query on error
        }
      }

      logger.info("Ingestion job completed");
    } catch (error) {
      logger.error(
        "Ingestion job failed",
        error instanceof Error ? error : new Error(String(error))
      );
      // Don't re-throw; cron job should continue running
    }
  });

  logger.info("Ingestion job scheduled (runs every 20 minutes)");
}
