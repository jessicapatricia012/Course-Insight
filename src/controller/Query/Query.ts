import { Direction, Logic, MComparator, MField, SField } from "./enums";
import { InsightError, InsightResult, ResultTooLargeError } from "../IInsightFacade";
import { Room, Section } from "../Dataset/Dataset";
import { getKey, Transformation } from "./QueryPlus";

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
	private transformation: Transformation | null;

	constructor(where: Where, options: Options, transformation: Transformation | null) {
		this.where = where;
		this.options = options;
		this.transformation = transformation;
	}

	/**
	 * Queries sections based on where and options
	 * @param things - things to query
	 */
	public query(things: Section[] | Room[]): InsightResult[] {
		console.time("handlewhere");

		let filteredThings: any = this.where.handleWhere(things);
		console.timeEnd("handlewhere");
		console.time("transform");

		if (this.transformation !== null) {
			filteredThings = this.transformation.transform(filteredThings);
		}
		console.timeEnd("transform");

		if (filteredThings.length > this.MAX_RES) {
			throw new ResultTooLargeError("Result exceed 5000");
		}

		return this.options.handleOptions(filteredThings);
	}
}

export class Where {
	private filter: Filter;

	//REQUIRES: toFilter is an array of Sections (most likely from dataset field above)
	//EFFECTS: a filtered array of sections with WHERE clause applied
	public handleWhere(toFilter: Section[] | Room[]): Array<Section | Room> {
		// Takes an array of Sections
		const result: Array<Section | Room> = [];
		for (const thing of toFilter) {
			if (this.filter === null || Object.keys(this.filter).length === 0) {
				// no filtering, handles empty WHERE ( WHERE:{} )

				result.push(thing);
			} else if (this.filter.performFilter(thing)) {
				result.push(thing);
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
	public abstract performFilter(section: Section | Room): boolean;
}

export class SComparison extends Filter {
	private skey: SField; //SField to compare
	private val: string; //value to compare with

	constructor(skey: SField, val: string) {
		super();
		this.skey = skey;
		this.val = val;
	}
	public performFilter(thing: Section | Room): boolean {
		let val = this.val;
		if (val.slice(1, -1).includes("*")) {
			// remove first and last char (potentially *), thn check if there's still *
			throw new InsightError("Illegal wildcard usage");
		}

		if (val.startsWith("*") && val.endsWith("*")) {
			val = val.slice(1, -1);
			return String(getKey(thing, this.skey)).includes(String(val));
		} else if (val.startsWith("*")) {
			val = val.slice(1);
			return String(getKey(thing, this.skey)).endsWith(String(val));
		} else if (val.endsWith("*")) {
			val = val.slice(0, -1);
			return String(getKey(thing, this.skey)).startsWith(String(val));
		}

		return String(getKey(thing, this.skey)) === String(val);
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

	public performFilter(thing: Section | Room): boolean {
		if (this.comp === "LT") {
			return Number(getKey(thing, this.mkey)) < Number(this.val);
		} else if (this.comp === "GT") {
			return Number(getKey(thing, this.mkey)) > Number(this.val);
		} else if (this.comp === "EQ") {
			return Number(getKey(thing, this.mkey)) === Number(this.val);
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
	public performFilter(thing: Section | Room): boolean {
		if (this.logic === "AND") {
			// AND
			let result: boolean = this.filterList[0].performFilter(thing); // perform first filter because result needs to be initialized
			for (const filter of this.filterList) {
				//Loops through all filters in List
				if (filter === null || Object.keys(filter).length === 0) {
					throw new InsightError("Invalid filter in filter list");
				}
				result = filter.performFilter(thing) && result;
			}
			return result;
		} else if (this.logic === "OR") {
			// OR
			let result: boolean = this.filterList[0].performFilter(thing);
			for (const filter of this.filterList) {
				if (filter === null || Object.keys(filter).length === 0) {
					throw new InsightError("Invalid filter in filter list");
				}
				result = filter.performFilter(thing) || result;
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

	public performFilter(thing: Section | Room): boolean {
		if (this.filter === null || Object.keys(this.filter).length === 0) {
			throw new InsightError("No FILTER on NOT");
		}
		return !this.filter.performFilter(thing);
	}
}

export class Options {
	private datasetId: string; //To append with keys in final object
	private keys: Array<MField | SField | string>;
	private order: Array<MField | SField | string>;
	private dir: Direction;

	//REQUIRES: sections is an array of valid sections
	//EFFECTS: Returns an array of InsightResult with filtred fields and ordered accordingly
	// (NOTE: This is the final result returned by performQuery)
	public handleOptions(things: Array<any>): InsightResult[] {
		const result: InsightResult[] = [];
		things.sort(this.fieldSorter(this.order, this.dir));
		for (const thing of things) {
			const toPush: InsightResult = {};
			for (const key of this.keys) {
				if (!(key in MField || key in SField)) toPush[key] = thing[key];
				else toPush[this.datasetId + "_" + key] = thing[key];
			}
			result.push(toPush);
		}
		// if (this.order in MField || this.order in SField) result = this.orderResultBy(result, this.order);
		//result.sort(this.fieldSorter(this.order, this.dir));
		return result;
	}

	private orderResultBy(result: InsightResult[], order: MField | SField | string): InsightResult[] {
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

	private sortArray(arr: InsightResult[], order: Array<MField | SField | string>, dir: Direction): InsightResult[] {
		return arr.sort(this.fieldSorter(order, dir));
	}

	private fieldSorter(fields: Array<any>, direction: Direction) {
		return function (a: any, b: any): number {
			return fields
				.map(function (field) {
					let dir = 1;
					if (direction === Direction.DOWN) dir = -1;
					if (a[field] > b[field]) return dir;
					if (a[field] < b[field]) return -dir;
					return 0;
				})
				.reduce(function firstNonZeroValue(p, n) {
					if (p) return p;
					else return n;
				}, 0);
		};
	}

	constructor(
		datasetId: string,
		keys: Array<MField | SField | string>,
		order: Array<MField | SField | string>,
		dir: Direction
	) {
		this.datasetId = datasetId;
		this.keys = keys;
		this.order = order;
		this.dir = dir;
	}
}
