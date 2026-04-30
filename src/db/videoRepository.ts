import { pool } from "./db";

export async function upsertVideo(video: any) {
  const query = `
    INSERT INTO videos (
      id, title, description, title_length, description_length,
      tag_count, duration_seconds, publish_hour, publish_day,
      view_count, like_count, comment_count
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
    )
    ON CONFLICT (id) DO UPDATE SET
      view_count = EXCLUDED.view_count,
      like_count = EXCLUDED.like_count,
      comment_count = EXCLUDED.comment_count
  `;

  const values = [
    video.id,
    video.title,
    video.description,
    video.title_length,
    video.description_length,
    video.tag_count,
    video.duration_seconds,
    video.publish_hour,
    video.publish_day,
    video.view_count,
    video.like_count,
    video.comment_count,
  ];

  await pool.query(query, values);
}