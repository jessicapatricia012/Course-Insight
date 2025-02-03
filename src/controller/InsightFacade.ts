import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
import { Dataset } from "./Dataset";
import { DatasetProcessor } from "./DatasetProcessor";

//import JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: Dataset[];

	constructor() {
		this.datasets = [];
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		const datasetProcessor = new DatasetProcessor();
		if (!datasetProcessor.validId(id)) {
			throw new InsightError("Invalid id");
		}
		if (await datasetProcessor.isInDisk(id)) {
			// Check if dataset exists on disk
			throw new InsightError("Dataset with the same id already exists");
		}
		// await datasetProcessor.validateDataset(content); //check if the sections, course etc is valid
		if (kind === InsightDatasetKind.Sections) {
			const dataset = await datasetProcessor.parseContent(id, content);
			this.datasets.push(dataset);
			await datasetProcessor.addToDisk(id, dataset);
			return this.datasets.map((ds) => ds.id);
		} else {
			throw new Error(`unimplemented!`);
		}
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
