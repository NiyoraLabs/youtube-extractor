import axios from "axios";
import { env } from "../../config/env";
import { withRetry } from "../../utils/retry";
import { rateLimit } from "../../utils/rateLimiter";


const BASE_URL = "https://www.googleapis.com/youtube/v3";
const wait = rateLimit(200);

export async function searchVideos(query: string, pageToken?: string) {
	return withRetry(async () => {
		await wait();
		const res = await axios.get(`${BASE_URL}/search`, {
			params: {
				part: "snippet",
				q: query,
				type: "video",
				maxResults: 50,
				pageToken,
				key: env.YOUTUBE_API_KEY,
			},
		});

		return res.data;
	})
}

export async function getVideosDetails(ids: string[]) {
	return withRetry(async () => {
		await wait();
		const res = await axios.get(`${BASE_URL}/videos`, {
			params: {
				part: "snippet,statistics,contentDetails",
				id: ids.join(","),
				key: env.YOUTUBE_API_KEY,
			},
		});

		return res.data.items;
	});
}