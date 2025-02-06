import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { Dataset } from "./Dataset";
import { DatasetProcessor } from "./DatasetProcessor";
import { QueryParser } from "./Query/QueryParser";
import { Query } from "./Query/Query";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private MAX_RES = 5000;
	private datasets: Dataset[];

	constructor() {
		this.datasets = [];
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!DatasetProcessor.validId(id)) {
			throw new InsightError("Invalid id");
		}

		// Check if dataset exists on disk
		if (await DatasetProcessor.isInDisk(id)) {
			throw new InsightError("Dataset with the same id already exists");
		}

		if (kind === InsightDatasetKind.Sections) {
			const dataset = await DatasetProcessor.parseContent(id, content);
			this.datasets.push(dataset);
			await DatasetProcessor.addToDisk(id, dataset);
			return this.datasets.map((ds) => ds.insightDataset.id);
		} else {
			throw new Error(`unimplemented!`);
		}
	}

	public async removeDataset(id: string): Promise<string> {
		if (!DatasetProcessor.validId(id)) {
			throw new InsightError("Invalid id");
		}

		// Check if dataset exists on disk
		if (!(await DatasetProcessor.isInDisk(id))) {
			throw new NotFoundError("Dataset not found");
		}

		const index = this.datasets.indexOf(Dataset.getDatasetWithId(id, this.datasets));
		this.datasets.splice(index, 1); // Remove the dataset

		await DatasetProcessor.deleteFromDisk(id);

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const parser: QueryParser = new QueryParser();
		const queryObj: Query = parser.parseQuery(query);
		const id = parser.getDatasetId();

		// Check if dataset exists on disk
		if (!(await DatasetProcessor.isInDisk(id))) {
			throw new InsightError("id not found");
		}

		let dataset: Dataset;
		try {
			dataset = Dataset.getDatasetWithId(id, this.datasets); // try to read from datasets
		} catch {
			// memory doesnt contain id, read from disk instead
			dataset = await DatasetProcessor.getDatasetFromDiskWithId(id); //guaranteed to be in disk
			this.datasets.push(dataset); // add to datasets
		}

		const result = queryObj.query(dataset.sections);
		if (result.length > this.MAX_RES) {
			throw new ResultTooLargeError("Result exceed 5000");
		}
		return result;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return DatasetProcessor.readFromDisk();
	}
}
