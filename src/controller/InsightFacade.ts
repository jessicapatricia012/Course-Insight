import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
} from "./IInsightFacade";
import { Dataset } from "./Dataset/Dataset";
import { DatasetProcessor } from "./Dataset/DatasetProcessor";
import { QueryParser } from "./Query/QueryParser";
// import { Query } from "./Query/Query";
import { ZipParser, SectionParser, RoomParser } from "./Dataset/ZipParser";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public static datasets: Dataset[];

	constructor() {
		InsightFacade.datasets = [];
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		DatasetProcessor.validateId(id);

		// Check if dataset exists on disk
		if (await DatasetProcessor.isInDisk(id)) {
			throw new InsightError("Dataset with the same id already exists");
		}

		let parser: ZipParser;
		if (kind === InsightDatasetKind.Sections) {
			parser = new SectionParser();
		} else if (kind === InsightDatasetKind.Rooms) {
			parser = new RoomParser();
		} else {
			throw new InsightError("Kind not recognized");
		}

		const dataset = await parser.parseContent(id, content, kind);
		InsightFacade.datasets.push(dataset);
		await DatasetProcessor.addToDisk(id, dataset);
		return InsightFacade.datasets.map((ds) => ds.insightDataset.id);
	}

	public async removeDataset(id: string): Promise<string> {
		DatasetProcessor.validateId(id);

		// Check if dataset exists on disk
		if (!(await DatasetProcessor.isInDisk(id))) {
			throw new NotFoundError("Dataset not found");
		}

		const index = InsightFacade.datasets.indexOf(Dataset.getDatasetWithId(id, InsightFacade.datasets));
		InsightFacade.datasets.splice(index, 1); // Remove the dataset

		await DatasetProcessor.deleteFromDisk(id);

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const parser: QueryParser = new QueryParser();
		// const queryObj: Query = parser.parseQuery(query);
		const id = parser.getDatasetId();

		// Check if dataset exists on disk
		if (!(await DatasetProcessor.isInDisk(id))) {
			throw new InsightError("id not found");
		}

		let dataset: Dataset;
		try {
			dataset = Dataset.getDatasetWithId(id, InsightFacade.datasets); // try to read from datasets
		} catch {
			dataset = await DatasetProcessor.getDatasetFromDiskWithId(id); //guaranteed to be in disk
			InsightFacade.datasets.push(dataset); // add to datasets
		}
		throw new InsightError("a");

		// TODO: make all query functions take data:Sections[]|Rooms[] instead of sections:Section[]
		// const result = queryObj.query(dataset.data);

		// return result;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return DatasetProcessor.readFromDisk();
	}
}
