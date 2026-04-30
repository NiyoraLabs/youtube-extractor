import { pool } from "../db/db";
import { fetchYoutubeCategories } from "../modules/youtube/category.service";
import { CategoryItem, CategorySuccessResponse } from "../modules/youtube/youtube.types";

const CATEGORY_COLUMNS = ["id", "name", "region", "assignable"];

function validateYoutubeCategoryResponse(response: CategorySuccessResponse): void {
	if (!response?.items || !Array.isArray(response.items) || response.items.length === 0) {
		throw new Error("YouTube categories response is empty or invalid.");
	}

	for (const category of response.items) {
		if (!category?.id || !category.snippet?.title) {
			throw new Error(`Invalid category payload detected: ${JSON.stringify(category)}`);
		}
	}
}

function buildCategoryUpsertQuery(items: CategoryItem[], region: string) {
	if (!region) {
		throw new Error('Region is required');
	}
	const values: Array<string | boolean> = [];
	const rows = items.map((item, index) => {
		const offset = index * CATEGORY_COLUMNS.length;
		const assignable = item.snippet.assignable ?? true;

		values.push(item.id, item.snippet.title, region, assignable);

		return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
	});

	return {
		text: `INSERT INTO youtube_categories (${CATEGORY_COLUMNS.join(", ")})\nVALUES\n${rows.join(",\n")}\nON CONFLICT (id, region) DO UPDATE\n  SET name = EXCLUDED.name,\n      assignable = EXCLUDED.assignable,\n      updated_at = CURRENT_TIMESTAMP`,
		values,
	};
}

async function getRegionCategoryCount(region: string): Promise<number> {
	const result = await pool.query(
		`SELECT COUNT(*) AS count FROM youtube_categories WHERE region = $1`,
		[region]
	);

	return Number(result.rows[0]?.count ?? 0);
}

async function upsertCategories(items: CategoryItem[], region: string): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const query = buildCategoryUpsertQuery(items, region);
		await client.query(query.text, query.values);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export async function ensureCategoriesSeeded(region = "NG") {
	const count = await getRegionCategoryCount(region);
	if (count > 0) {
		console.log(`youtube_categories already seeded for region=${region}. row_count=${count}`);
		return;
	}

	console.log(`youtube_categories is empty for region=${region}. Fetching categories from YouTube...`);

	const categoriesResponse = await fetchYoutubeCategories();
	validateYoutubeCategoryResponse(categoriesResponse);

	await upsertCategories(categoriesResponse.items, region);

	console.log(`Seeded ${categoriesResponse.items.length} YouTube categories for region=${region}.`);
}
