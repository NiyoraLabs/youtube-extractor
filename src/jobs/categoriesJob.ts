import { pool } from "../db/db";
import { fetchYoutubeCategories } from "../modules/youtube/category.service";
import { CategoryItem, CategorySuccessResponse } from "../modules/youtube/youtube.types";
import { logger } from "../utils/logger";
import {
	createDatabaseError,
	createValidationError,
} from "../utils/errorHandler";

const CATEGORY_COLUMNS = ["id", "name", "region", "assignable"];

function validateYoutubeCategoryResponse(response: CategorySuccessResponse): void {
	if (!response?.items || !Array.isArray(response.items) || response.items.length === 0) {
		throw createValidationError("YouTube categories response is empty or invalid.", {
			response,
		});
	}

	for (const category of response.items) {
		if (!category?.id || !category.snippet?.title) {
			throw createValidationError("Invalid category payload detected.", {
				categoryId: category?.id,
				title: category?.snippet?.title,
			});
		}
	}
}

function buildCategoryUpsertQuery(items: CategoryItem[], region: string) {
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
	try {
		const result = await pool.query(
			`SELECT COUNT(*) AS count FROM youtube_categories WHERE region = $1`,
			[region]
		);

		return Number(result.rows[0]?.count ?? 0);
	} catch (error) {
		logger.error(
			"Failed to query category count",
			error instanceof Error ? error : new Error(String(error)),
			{ region }
		);
		throw createDatabaseError(
			`Failed to query category count for region ${region}`,
			error instanceof Error ? error : new Error(String(error))
		);
	}
}

async function upsertCategories(items: CategoryItem[], region: string): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const query = buildCategoryUpsertQuery(items, region);
		await client.query(query.text, query.values);
		await client.query("COMMIT");

		logger.debug("Category upsert transaction committed", {
			region,
			itemCount: items.length,
		});
	} catch (error) {
		await client.query("ROLLBACK");

		logger.error(
			"Category upsert transaction failed, rolled back",
			error instanceof Error ? error : new Error(String(error)),
			{ region, itemCount: items.length }
		);

		throw createDatabaseError(
			`Failed to upsert categories for region ${region}`,
			error instanceof Error ? error : new Error(String(error))
		);
	} finally {
		client.release();
	}
}

export async function ensureCategoriesSeeded(region = "NG") {
	try {
		const count = await getRegionCategoryCount(region);
		if (count > 0) {
			logger.info(`youtube_categories already seeded`, {
				region,
				rowCount: count,
			});
			return;
		}

		logger.info(`youtube_categories is empty for region, starting seed`, { region });

		const categoriesResponse = await fetchYoutubeCategories();
		validateYoutubeCategoryResponse(categoriesResponse);

		await upsertCategories(categoriesResponse.items, region);

		logger.info(`YouTube categories seeded successfully`, {
			region,
			count: categoriesResponse.items.length,
		});
	} catch (error) {
		logger.error(
			"Categories seeding failed",
			error instanceof Error ? error : new Error(String(error)),
			{ region }
		);
		throw error;
	}
}
