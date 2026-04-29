import { createCategoriesTable } from "./db/categoryRepository";
import { ensureCategoriesSeeded } from "./jobs/categoriesJob";
import { startIngestionJob } from "./jobs/ingestionJob";

export async function initCategories() {
	await createCategoriesTable();
	await ensureCategoriesSeeded();
}
(async () => {
	try {
		await initCategories();
		startIngestionJob();
	} catch (error) {
		console.error("Error starting ingestion job:", error);
		process.exit(1);
	}
})();