import { Section } from "./Section";
import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";

export class Dataset implements InsightDataset {
	public id: string;
	public kind: InsightDatasetKind;
	public numRows: number;
	public sections: Section[];

	constructor(id: string, kind: InsightDatasetKind) {
		this.id = id;
		this.kind = kind;
		this.sections = [];
		this.numRows = 0;
	}
}
