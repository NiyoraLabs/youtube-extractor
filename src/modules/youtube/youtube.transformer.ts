import { parseDuration } from "../../utils/durationParser";

export function transform(video: any) {
  const snippet = video.snippet;
  const stats = video.statistics;
  const content = video.contentDetails;

  const published = new Date(snippet.publishedAt);

  return {
    id: video.id,
    title: snippet.title,
    description: snippet.description,
    title_length: snippet.title.length,
    description_length: snippet.description.length,
    tag_count: snippet.tags?.length || 0,
    duration_seconds: parseDuration(content.duration),
    publish_hour: published.getHours(),
    publish_day: published.getDay(),
    view_count: Number(stats.viewCount || 0),
    like_count: Number(stats.likeCount || 0),
    comment_count: Number(stats.commentCount || 0),
  };
}