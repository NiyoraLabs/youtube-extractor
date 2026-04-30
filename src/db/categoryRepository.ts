import { pool } from "./db";

export async function createCategoriesTable() {
	try {
		await pool.query(`
			CREATE TABLE IF NOT EXISTS youtube_categories (
				id VARCHAR(10) NOT NULL,
				name TEXT NOT NULL,
				region VARCHAR(5) NOT NULL,
				assignable BOOLEAN DEFAULT true,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (id, region)
			);
		`);

	} catch (error) {
		console.error("Error creating youtube_categories table:", error);
		throw error;
	}
}