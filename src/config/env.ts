import dotenv from "dotenv";
dotenv.config();

export const env = {
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY!,
  DB_URL: process.env.DB_URL!,
};