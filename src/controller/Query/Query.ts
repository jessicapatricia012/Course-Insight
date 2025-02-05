import { SField, MField, MComparator, Logic } from "./enums";
import { InsightResult } from "../IInsightFacade";
import { Section } from "../Section";

// Query class representing a query
// General process of query:
// 1. Extract Section[] from a dataset
// 2. Call handleWhere() on Section[] to filter and get another Section[]
// 3. Call handleOptions() on Section[] to get only wanted fields and order the array, and get InsightResult[]
// 4. return this InsightResult[] and done!!! :)
export class Query {
	private where: Where; // WHERE Clause
	private options: Options; // OPTIONS Clause

	constructor(where: Where, options: Options) {
		this.where = where;
		this.options = options;
	}

	//This is the main function called by the UI to do the query
	//REQUIRES: sections is an array of section from a  dataset
	//EFFECTS: Returns the result of the query
	public query(sections: Section[]): InsightResult[] {
		const filteredSections: Section[] = this.where.handleWhere(sections);
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
			if (this.filter.performFilter(section)) {
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
		return section[this.skey] === this.val;
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
			return section[this.mkey] < this.val;
		} else if (this.comp === "GT") {
			return section[this.mkey] > this.val;
		} else if (this.comp === "EQ") {
			return section[this.mkey] === this.val;
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
				result = filter.performFilter(section) && result;
			}
			return result;
		} else {
			// OR
			let result: boolean = this.filterList[0].performFilter(section);
			for (const filter of this.filterList) {
				result = filter.performFilter(section) || result;
			}
			return result;
		}
	}
}

export class Negation extends Filter {
	private filter: Filter;

	constructor(filter: Filter) {
		super();
		this.filter = filter;
	}

	public performFilter(section: Section): boolean {
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
		const result: InsightResult[] = [];

		for (const section of sections) {
			const toPush: InsightResult = {};
			for (const key of this.keys) {
				toPush[this.datasetId + "_" + key] = section[key];
			}
			result.push(toPush);
		}
		// TODO: Still have to order result before returning
		return result;
	}

	constructor(datasetId: string, keys: Array<MField | SField>, order: MField | SField) {
		this.datasetId = datasetId;
		this.keys = keys;
		this.order = order;
	}
}
