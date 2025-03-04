// import { Section } from "./Section";
import { InsightDataset } from "../IInsightFacade";
// import { Room } from "./Room";

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

export class Section {
	public id: string;
	public uuid: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(json: any) {
		this.id = json.Course;
		this.uuid = json.id.toString();
		this.title = json.Title;
		this.instructor = json.Professor;
		this.dept = json.Subject;
		if (json.Section === "overall") {
			this.year = 1900;
		} else {
			this.year = json.Year;
		}
		this.avg = json.Avg;
		this.pass = json.Pass;
		this.fail = json.Fail;
		this.audit = json.Audit;
	}
}

export class Room {
	public fullname: string;
	public shortname: string;
	public number: string;
	public name: string;
	public address: string;
	public lat: number;
	public lon: number;
	public seats: number;
	public type: string;
	public furniture: string;
	public href: string;

	constructor() {
		this.fullname = "";
		this.shortname = "";
		this.number = "";
		this.name = "";
		this.address = "";
		this.lat = 0;
		this.lon = 0;
		this.seats = 0;
		this.type = "";
		this.furniture = "";
		this.href = "";
	}
}

export class Building {
	public shortname: string;
	public fullname: string;
	public address: string;
	public link: string;

	constructor(shortname: string, fullname: string, address: string, link: string) {
		this.shortname = shortname;
		this.fullname = fullname;
		this.address = address;
		this.link = link;
	}
}
