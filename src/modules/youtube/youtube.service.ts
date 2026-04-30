import pLimit from "p-limit";
import { searchVideos, getVideosDetails } from "./youtube.client";
import { transform } from "./youtube.transformer";
import { upsertVideo } from "../../db/videoRepository";
import { logger } from "../../utils/logger";

const limit = pLimit(5);
const MAX_PAGES = 3;

async function processPageVideos(videos: any[], query: string) {
	await Promise.all(
		videos.map((video: any) =>
			limit(async () => {
				try {
					const transformed = transform(video);
					await upsertVideo(transformed);
				} catch (error) {
					logger.error(
						"Failed to upsert video",
						error instanceof Error ? error : new Error(String(error)),
						{ videoId: video.id, query }
					);
				}
			})
		)
	);
	return videos.length;
}

async function fetchAndProcessPage(
	query: string,
	pageNum: number,
	nextPageToken?: string
): Promise<{ upsertCount: number; nextToken?: string; shouldContinue: boolean }> {
	logger.debug("Searching videos", { query, page: pageNum });
	const searchRes = await searchVideos(query, nextPageToken);

	if (!searchRes.items?.length) {
		logger.warn("No videos found in search result", { query, page: pageNum });
		return { upsertCount: 0, shouldContinue: false };
	}

	const ids = searchRes.items
		.map((item: any) => item.id?.videoId)
		.filter((id: any) => !!id);

	if (!ids.length) {
		logger.warn("No valid video IDs extracted", { query, page: pageNum });
		return { upsertCount: 0, shouldContinue: false };
	}

	logger.debug("Fetching video details", { query, page: pageNum, idCount: ids.length });
	const videos = await getVideosDetails(ids);

	if (!videos?.length) {
		logger.warn("No video details returned", { query, page: pageNum });
		return { upsertCount: 0, nextToken: searchRes.nextPageToken, shouldContinue: !!searchRes.nextPageToken };
	}

	logger.debug("Upserting videos", { query, page: pageNum, videoCount: videos.length });
	const upsertCount = await processPageVideos(videos, query);

	return {
		upsertCount,
		nextToken: searchRes.nextPageToken,
		shouldContinue: !!searchRes.nextPageToken,
	};
}

export async function ingestQuery(query: string) {
	let nextPageToken: string | undefined = undefined;
	let totalVideosProcessed = 0;

	try {
		logger.info("Starting video ingestion", { query });

		for (let i = 0; i < MAX_PAGES; i++) {
			try {
				const { upsertCount, nextToken, shouldContinue } = await fetchAndProcessPage(
					query,
					i + 1,
					nextPageToken
				);

				totalVideosProcessed += upsertCount;
				nextPageToken = nextToken;

				if (!shouldContinue) break;
			} catch (error) {
				logger.error(
					"Error processing page",
					error instanceof Error ? error : new Error(String(error)),
					{ query, page: i + 1 }
				);
				break;
			}
		}

		logger.info("Video ingestion completed", {
			query,
			totalVideosProcessed,
		});
	} catch (error) {
		logger.error(
			"Video ingestion failed",
			error instanceof Error ? error : new Error(String(error)),
			{ query }
		);
		throw error;
	}
}
