import { InsightError, InsightDataset } from "../IInsightFacade";
import { Dataset } from "./Dataset";
import fs from "fs-extra";
import path from "path";

const DATA_DIR = "./data";

export class DatasetProcessor {
	/* returns true if id is validationPromises, 
    false otherwise (has underscore or whitespace only)*/
	public static validateId(id: string): void {
		if (!id.trim() || id.includes("_")) {
			throw new InsightError("Invalid id");
		}
	}

	/* returns true if dataset with id <id> is in disk, 
    false otherwise */
	public static async isInDisk(id: string): Promise<boolean> {
		try {
			await fs.ensureDir(DATA_DIR);
			const datasetPath = path.join(DATA_DIR, `${id}.json`);
			await fs.access(datasetPath); // Check if the file exists
			return true;
		} catch {
			return false; // File doesn't exist
		}
	}

	public static async addToDisk(id: string, dataset: Dataset): Promise<void> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		await fs.writeJson(datasetPath, dataset);
	}

	public static async deleteFromDisk(id: string): Promise<void> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		await fs.remove(datasetPath);
	}

	public static async readFromDisk(): Promise<InsightDataset[]> {
		await fs.ensureDir(DATA_DIR);
		// Get all files in the /data directory
		const files = await fs.readdir(DATA_DIR);

		// Read each JSON file and extract the required data
		const datasets = await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(DATA_DIR, file);
				const fileContent = await fs.readJson(filePath);
				const { id, kind, numRows } = fileContent.insightDataset;

				return { id, kind, numRows };
			})
		);
		return datasets;
	}

	public static async getDatasetFromDiskWithId(id: string): Promise<Dataset> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		const content = await fs.readJson(datasetPath);

		const insightDataset: InsightDataset = content.insightDataset;
		const dataset = new Dataset(insightDataset);

		for (const data of content.data) {
			dataset.data.push(data);
		}

		return dataset;
	}
}
