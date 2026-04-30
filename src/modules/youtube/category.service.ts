import axios from "axios";
import { createApiError } from "../../utils/errorHandler";
import { logger } from "../../utils/logger";
import { CategorySuccessResponse } from "./youtube.types";
import { withRetry } from "../../utils/retry";

export async function fetchYoutubeCategories(): Promise<CategorySuccessResponse> {
	const regionCode = "NG";
	return withRetry(async () => {
		try {
			logger.debug("Fetching YouTube categories", { regionCode });

			const categoriesResult = await axios.get("https://www.googleapis.com/youtube/v3/videoCategories", {
				params: {
					part: "snippet",
					regionCode,
					key: process.env.YOUTUBE_API_KEY,
				},
			});

			logger.info("Successfully fetched YouTube categories", {
				regionCode,
				count: categoriesResult.data.items?.length || 0,
			});

			return categoriesResult.data;
		} catch (error) {
			const statusCode = error instanceof axios.AxiosError ? error.response?.status : undefined;
			const message = `Failed to fetch YouTube categories for region ${regionCode}`;

			logger.error(message, error instanceof Error ? error : new Error(String(error)), {
				regionCode,
				statusCode,
			});

			throw createApiError(message, statusCode, error instanceof Error ? error : new Error(String(error)));
		}

	})

}