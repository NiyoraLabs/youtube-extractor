import pLimit from "p-limit";
import { searchVideos, getVideosDetails } from "./youtube.client";
import { transform } from "./youtube.transformer";
import { upsertVideo } from "../../db/videoRepository";

const limit = pLimit(5); 

export async function ingestQuery(query: string) {
  let nextPageToken: string | undefined = undefined;

  for (let i = 0; i < 3; i++) { 
    const searchRes = await searchVideos(query, nextPageToken);

    const ids = searchRes.items.map((item: any) => item.id.videoId);

    const videos = await getVideosDetails(ids);

    await Promise.all(
      videos.map((video: any) =>
        limit(async () => {
          const transformed = transform(video);
          await upsertVideo(transformed);
        })
      )
    );

    nextPageToken = searchRes.nextPageToken;
    if (!nextPageToken) break;
  }
}