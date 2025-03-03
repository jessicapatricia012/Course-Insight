import {ApplyToken, Logic, MComparator, MField, SField} from "./enums";
import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Room, Section} from "../Dataset/Dataset";

// Query class representing a query
// General process of query:
// 1. Extract Section[] from a dataset
// 2. Call handleWhere() on Section[] to filter and get another Section[]
// 3. Call handleOptions() on Section[] to get only wanted fields and order the array, and get InsightResult[]
// 4. return this InsightResult[] and done!!! :)
export class Query {
	private where: Where; // WHERE Clause
	private options: Options; // OPTIONS Clause
	private MAX_RES = 5000;

	constructor(where: Where, options: Options) {
		this.where = where;
		this.options = options;
	}

	//This is the main function called by the UI to do the query
	//REQUIRES: sections is an array of section from a  dataset
	//EFFECTS: Returns the result of the query
	public query(sections: Section[]): InsightResult[] {
		const filteredSections: Section[] = this.where.handleWhere(sections);
		if (filteredSections.length > this.MAX_RES) {
			throw new ResultTooLargeError("Result exceed 5000");
		}
		return this.options.handleOptions(filteredSections);
	}
}

export class Where {
	private filter: Filter;

	//REQUIRES: toFilter is an array of Sections (most likely from dataset field above)
	//EFFECTS: a filtered array of sections with WHERE clause applied
	public handleWhere(toFilter: Section[]): Section[] {
		// Takes an array of Sections
		const result: Section[] = [];
		for (const section of toFilter) {
			if (this.filter === null || Object.keys(this.filter).length === 0) {
				// no filtering, handles empty WHERE ( WHERE:{} )

				result.push(section);
			} else if (this.filter.performFilter(section)) {
				result.push(section);
			}
		}
		return result;
	}

	constructor(filter: Filter) {
		this.filter = filter;
	}
}

export abstract class Filter {
	//This is an abstract function implemented by all comparator classes
	//REQUIRES: section is a one valid section to check
	//EFFECTS: returns true if section passes Comparator check
	public abstract performFilter(section: Section): boolean;
}

export class SComparison extends Filter {
	private skey: SField; //SField to compare
	private val: string; //value to compare with

	constructor(skey: SField, val: string) {
		super();
		this.skey = skey;
		this.val = val;
	}
	public performFilter(section: Section): boolean {
		let val = this.val;
		if (val.slice(1, -1).includes("*")) {
			// remove first and last char (potentially *), thn check if there's still *
			throw new InsightError("Illegal wildcard usage");
		}

		if (val.startsWith("*") && val.endsWith("*")) {
			val = val.slice(1, -1);
			return String(section[this.skey as keyof Section]).includes(String(val));
		} else if (val.startsWith("*")) {
			val = val.slice(1);
			return String(section[this.skey as keyof Section]).endsWith(String(val));
		} else if (val.endsWith("*")) {
			val = val.slice(0, -1);
			return String(section[this.skey as keyof Section]).startsWith(String(val));
		}

		return String(section[this.skey as keyof Section]) === String(val);
	}
}

export class MComparison extends Filter {
	private mkey: MField;
	private val: number;
	private comp: MComparator;

	constructor(mkey: MField, val: number, comp: MComparator) {
		super();
		this.mkey = mkey;
		this.val = val;
		this.comp = comp;
	}

	public performFilter(section: Section): boolean {
		if (this.comp === "LT") {
			return Number(section[this.mkey as keyof Section]) < Number(this.val);
		} else if (this.comp === "GT") {
			return Number(section[this.mkey as keyof Section]) > Number(this.val);
		} else if (this.comp === "EQ") {
			return Number(section[this.mkey as keyof Section]) === Number(this.val);
		}
		return false;
	}
}

export class LComparison extends Filter {
	private filterList: Filter[];
	private logic: Logic;

	constructor(filterList: Filter[], logic: Logic) {
		super();
		this.filterList = filterList;
		this.logic = logic;
	}
	public performFilter(section: Section): boolean {
		if (this.logic === "AND") {
			// AND
			let result: boolean = this.filterList[0].performFilter(section); // perform first filter because result needs to be initialized
			for (const filter of this.filterList) {
				//Loops through all filters in List
				if (filter === null || Object.keys(filter).length === 0) {
					throw new InsightError("Invalid filter in filter list");
				}
				result = filter.performFilter(section) && result;
			}
			return result;
		} else if (this.logic === "OR") {
			// OR
			let result: boolean = this.filterList[0].performFilter(section);
			for (const filter of this.filterList) {
				if (filter === null || Object.keys(filter).length === 0) {
					throw new InsightError("Invalid filter in filter list");
				}
				result = filter.performFilter(section) || result;
			}
			return result;
		}
		throw new InsightError("Invalid Logic operation");
	}
}

export class Negation extends Filter {
	private filter: Filter;

	constructor(filter: Filter) {
		super();
		this.filter = filter;
	}

	public performFilter(section: Section): boolean {
		if (this.filter === null || Object.keys(this.filter).length === 0) {
			throw new InsightError("No FILTER on NOT");
		}
		return !this.filter.performFilter(section);
	}
}

export class Options {
	private datasetId: string; //To append with keys in final object
	private keys: Array<MField | SField>;
	private order: MField | SField;

	//REQUIRES: sections is an array of valid sections
	//EFFECTS: Returns an array of InsightResult with filtred fields and ordered accordingly
	// (NOTE: This is the final result returned by performQuery)
	public handleOptions(sections: Section[]): InsightResult[] {
		let result: InsightResult[] = [];

		for (const section of sections) {
			const toPush: InsightResult = {};
			for (const key of this.keys) {
				toPush[this.datasetId + "_" + key] = section[key as keyof Section];
			}
			result.push(toPush);
		}
		if (this.order in MField || this.order in SField) result = this.orderResultBy(result, this.order);
		return result;
	}

	private orderResultBy(result: InsightResult[], order: MField | SField): InsightResult[] {
		const orderKey = this.datasetId + "_" + order;
		// selection sort
		let min: number;
		for (let i = 0; i < result.length - 1; i++) {
			min = i;
			for (let j = i + 1; j < result.length; j++) {
				if (order in SField) {
					if (String(result[j][orderKey]).localeCompare(String(result[min][orderKey])) < 0) {
						min = j;
					}
				} else if (order in MField && result[j][orderKey] < result[min][orderKey]) {
					min = j;
				}
			}
			[result[min], result[i]] = [result[i], result[min]];
		}
		return result;
	}

	constructor(datasetId: string, keys: Array<MField | SField>, order: MField | SField) {
		this.datasetId = datasetId;
		this.keys = keys;
		this.order = order;
	}
}











