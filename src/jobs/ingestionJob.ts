import cron from "node-cron";
import { ingestQuery } from "../modules/youtube/youtube.service";

const queries = [
  "nigerian comedy skits",
  "afrobeats",
  "lagos vlog"
];

export function startIngestionJob() {
  cron.schedule("*/20 * * * *", async () => {
    console.log("Running ingestion job...");

    for (const query of queries) {
      await ingestQuery(query);
    }

    console.log("Ingestion complete");
  });
}