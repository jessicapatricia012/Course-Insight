import { Section } from "./Section";
import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";

export class Dataset implements InsightDataset {
	public id: string;
	public kind: InsightDatasetKind;
	public numRows: number;
	public sections: Section[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number) {
		this.id = id;
		this.kind = kind;
		this.sections = [];
		this.numRows = numRows;
	}

	public static getDatasetWithId(id: string, datasets: Dataset[]): Dataset {
		const dataset = datasets.find((d) => d.id === id);
		if (dataset) {
			return dataset; // Return the found dataset
		} else {
			throw Error("Method should only be called when id is in datasets");
		}
	}
}
