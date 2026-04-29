import { pool } from "../db/db";
import { fetchYoutubeCategories } from "../modules/youtube/category.service";

export async function ensureCategoriesSeeded(region = "NG") {
	const { rows } = await pool.query(
		`SELECT COUNT(*) as count FROM youtube_categories WHERE region = $1`,
		[region]
	);

	const count = Number(rows[0].count);

	if (count > 0) {
		console.log("Categories already exist, skipping seed.");
		return;
	}

	console.log("Seeding YouTube categories...");

	const categories = await fetchYoutubeCategories();

	const values = categories.items.map(c => [
		c.id,
		c.snippet.title,
		region,
		c.snippet.assignable ?? true
	]);

	for (const v of values) {
		await pool.query(
			`INSERT INTO youtube_categories (id, name, region, assignable)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (id, region) DO NOTHING`,
			v
		);
	}

	console.log("Categories seeded.");
}