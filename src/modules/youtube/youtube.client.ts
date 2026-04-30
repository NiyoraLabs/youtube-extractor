import axios from "axios";
import { env } from "../../config/env";
import { withRetry } from "../../utils/retry";
import { rateLimit } from "../../utils/rateLimiter";
import { VideoDetailResponse } from "./youtube.types";
import { logger } from "../../utils/logger";
import { createApiError } from "../../utils/errorHandler";

const wait = rateLimit(200);

export async function searchVideos(query: string, pageToken?: string) {
	return withRetry(async () => {
		try {
			await wait();
			logger.debug("Searching YouTube videos", { query, pageToken });

			const res = await axios.get(`${env.BASE_URL}/search`, {
				params: {
					part: "snippet",
					q: query,
					type: "video",
					maxResults: 50,
					pageToken,
					key: env.YOUTUBE_API_KEY,
				},
			});

			logger.debug("Video search successful", {
				query,
				resultCount: res.data.items?.length || 0,
			});

			return res.data;
		} catch (error) {
			const statusCode = error instanceof axios.AxiosError ? error.response?.status : undefined;
			const message = `Failed to search YouTube videos for query "${query}"`;

			logger.error(message, error instanceof Error ? error : new Error(String(error)), {
				query,
				statusCode,
			});

			throw createApiError(message, statusCode, error instanceof Error ? error : new Error(String(error)));
		}
	});
}

export async function getVideosDetails(ids: string[]): Promise<VideoDetailResponse[]> {
	return withRetry(async () => {
		try {
			await wait();
			logger.debug("Fetching video details", { idCount: ids.length });

			const res = await axios.get(`${env.BASE_URL}/videos`, {
				params: {
					part: "snippet,statistics,contentDetails",
					id: ids.join(","),
					key: env.YOUTUBE_API_KEY,
				},
			});

			logger.debug("Video details fetched successfully", {
				idCount: ids.length,
				returnedCount: res.data.items?.length || 0,
			});

			return res.data.items;
		} catch (error) {
			const statusCode = error instanceof axios.AxiosError ? error.response?.status : undefined;
			const message = `Failed to fetch video details for ${ids.length} videos`;

			logger.error(message, error instanceof Error ? error : new Error(String(error)), {
				idCount: ids.length,
				statusCode,
			});

			throw createApiError(message, statusCode, error instanceof Error ? error : new Error(String(error)));
		}
	});
}
