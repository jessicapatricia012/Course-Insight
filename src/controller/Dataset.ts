import { Section } from "./Section";
import { InsightDataset } from "./IInsightFacade";

export class Dataset {
	public insightDataset: InsightDataset;
	public sections: Section[];

	constructor(insightDataset: InsightDataset) {
		this.insightDataset = insightDataset;
		this.sections = [];
	}

	public static getDatasetWithId(id: string, datasets: Dataset[]): Dataset {
		const dataset = datasets.find((d) => d.insightDataset.id === id);
		if (dataset) {
			return dataset; // Return the found dataset
		} else {
			throw Error("Method should only be called when id is in datasets");
		}
	}
}
