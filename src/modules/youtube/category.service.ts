import axios from "axios"
import { CategorySuccessResponse } from "./youtube.types";

export async function fetchYoutubeCategories(): Promise<CategorySuccessResponse> {
	const categoriesResult = await axios.get("https://www.googleapis.com/youtube/v3/videoCategories", {
		params: {
			part: "snippet",
			regionCode: "NG",
			key: process.env.YOUTUBE_API_KEY
		}
	});
	return categoriesResult.data;
}