import { Section } from "./Section";
import { InsightDataset } from "./IInsightFacade";
import { Room } from "./Room";

export class Dataset {
	public data: Section[] | Room[];
	public insightDataset: InsightDataset;

	constructor(insightDataset: InsightDataset) {
		this.data = [];
		this.insightDataset = insightDataset;
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
