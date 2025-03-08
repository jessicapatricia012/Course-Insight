import { Filter, LComparison, MComparison, Negation, Options, Query, SComparison, Where } from "./Query";
import { InsightError } from "../IInsightFacade";
import { ApplyToken, Direction, Logic, MComparator, MField, SField } from "./enums";
import { Apply, ApplyRule, Group, Transformation } from "./QueryPlus";

export class QueryParser {
	private datasetId: string; //to check consistent id throughout query
	private transKeys: Array<string>; //Columns can only use these keys

	constructor() {
		this.datasetId = ""; //intialize id as empty first
		this.transKeys = [];
	}

	public parseQuery(query: unknown): Query {
		if (!this.isObject(query) || query === null) {
			throw new InsightError("Invalid Query type");
		}

		if (!(this.isInObject(query, "WHERE") && this.isInObject(query, "OPTIONS"))) {
			throw new InsightError("Missing WHERE or OPTIONS Clause");
		}

		//Destructure WHERE, OPTIONS and TRANSFORMATIONS
		const { WHERE: whereObj, OPTIONS: optionsObj, TRANSFORMATIONS: transObj = null } = query as any;

		const where: Where = new Where(this.parseFilter(whereObj));
		const transformation: Transformation | null = this.parseTransformations(transObj);
		const options: Options = this.parseOptions(optionsObj);
		return new Query(where, options, transformation);
	}

	//Helper Functions

	//This is what is used to parse the body of the WHERE clause
	//REQUIRES: obj is an object representing a Filter
	//EFFECTS: Returns a Filter object representing the Filter
	private parseFilter(obj: unknown): Filter {
		let filter: Filter = {} as Filter;
		if (!this.isObject(obj) || Array.isArray(obj)) {
			throw new InsightError("Invalid WHERE clause body");
		}
		if (obj === null) {
			throw new InsightError("WHERE is null");
		}

		if (this.isInObject(obj, "LT") || this.isInObject(obj, "GT") || this.isInObject(obj, "EQ")) {
			const mcomp: MComparator = Object.keys(obj as Object)[0] as MComparator;
			filter = this.parseMComparison(Object.values(obj as Object)[0], mcomp);
		} else if (this.isInObject(obj, "IS")) {
			filter = this.parseSComparison(Object.values(obj as Object)[0]);
		} else if (this.isInObject(obj, "NOT")) {
			filter = this.parseNegation(Object.values(obj as Object)[0]);
		} else if (this.isInObject(obj, "AND") || this.isInObject(obj, "OR")) {
			filter = this.parseLComparison(Object.values(obj as Object)[0], Object.keys(obj as Object)[0] as Logic);
		} else if (obj !== null && obj !== undefined && Object.keys(obj).length > 0) {
			// contains invalid filter other than obove but not {}
			throw new InsightError("Invalid FILTER key");
		}
		return filter;
	}

	//REQUIRES: obj is an object representing an MComparison and MComparator is the type of comparison
	//EFFECTS: Returns an MComparison representation of the object
	private parseMComparison(obj: unknown, mcomp: MComparator): MComparison {
		const key: string = Object.keys(obj as Object)[0];
		const mfield = this.getField(key);
		if (!(mfield in MField)) {
			throw new InsightError("Invalid value for MField");
		}

		const val = Object.values(obj as Object)[0];
		if (typeof val !== "number") {
			throw new InsightError("Wrong value type for MComparison");
		}
		return new MComparison(mfield as MField, val, mcomp);
	}

	/**
	 * Extracts the field from the key of format: "idstring_field"
	 * Also checks that idstring is consistent
	 * @param key - string of format "idstring_field"
	 * @private
	 */
	private getField(key: string): string {
		// console.log(key);
		const keyTokens = key.split("_");
		if (keyTokens.length !== 2) {
			throw new InsightError("Invalid format for key: " + key);
		}
		this.updateId(keyTokens[0]);
		const field: string = keyTokens[1];
		return field;
	}

	//REQUIRES: obj is an object representing an SComparison
	//EFFECTS: Return an SComparison representation of the object
	private parseSComparison(obj: unknown): SComparison {
		const key: string = Object.keys(obj as Object)[0];
		const keyTokens = key.split("_");
		if (keyTokens.length !== 2) {
			throw new InsightError("Invalid format for SComparison key");
		}

		this.updateId(keyTokens[0]);
		const sfield: string = keyTokens[1];
		if (!(sfield in SField)) {
			throw new InsightError("Invalid value for SField");
		}

		const val = Object.values(obj as Object)[0];
		if (typeof val !== "string") {
			throw new InsightError("Wrong value type for SComparison");
		}
		return new SComparison(sfield as SField, val as string);
	}
	//REQUIRES: obj is an object representing a Negation
	//EFFECTS: Return an Negation representation of the object
	private parseNegation(obj: unknown): Negation {
		return new Negation(this.parseFilter(obj));
	}
	//REQUIRES: obj is an object representing an LComparison, logic is the type of Logic to apply
	//EFFECTS: Returns an LComparison representation of the object
	private parseLComparison(obj: unknown, logic: Logic): LComparison {
		const filterList: Filter[] = [];

		if (!Array.isArray(obj)) {
			throw new InsightError("Invalid logic filter list");
		}
		for (const filter of obj as Array<Object>) {
			filterList.push(this.parseFilter(filter));
		}
		if (filterList.length === 0) {
			throw new InsightError("Empty logic filter list");
		}
		return new LComparison(filterList, logic);
	}

	//REQUIRES: obj is an object representing an OPTIONS clause
	//EFFECTS: Returns an Options object representation of the clause
	private parseOptions(obj: unknown): Options {
		if (!this.isObject(obj) || Array.isArray(obj) || obj === null) {
			throw new InsightError("Invalid type for OPTIONS clause or is null");
		}
		if (!("COLUMNS" in (obj as Object))) throw new InsightError("Missing COLUMNS in OPTIONS");
		const { COLUMNS: columns, ORDER: order = null } = obj as any; //If ORDER doesn't exist, default value of null is assigned
		if (!(columns instanceof Array) || columns.length < 1)
			throw new InsightError("COLUMNS is not an array or COLUMNS is empty");
		const fields: Array<MField | SField | string> = []; //List of fields in COLUMNS
		for (const key of columns) {
			if (typeof key !== "string") {
				throw new InsightError("COLUMNS field must be a string");
			}
			let field: string;
			if (key.includes("_")) {
				//non-applykey
				field = this.getField(key);
				if (!(field in MField || field in SField)) throw new InsightError("Invalid COLUMNS field");
			} else field = key; //applykey
			if (this.transKeys.length !== 0)
				if (!this.transKeys.includes(key))
					// there's transformation
					throw new InsightError("COLUMN Keys must be in GROUP or APPLY");
			fields.push(field);
		}
		const { orderFields, dir } = this.parseOrder(order, columns);
		return new Options(this.datasetId, fields, orderFields, dir);
	}

	private parseOrder(order: any, columns: Array<string>): any {
		const orderFields: Array<MField | SField | string> = [];
		let dir: Direction = Direction.UP;
		if (order !== null) {
			if (this.isObject(order)) {
				//order is an object
				let keys;
				({ dir, keys } = order);
				if (!Object.values(Direction).includes(dir) || !Array.isArray(keys) || keys.length < 1)
					throw new InsightError("Invalid ORDER Object");

				keys.forEach((key: MField | SField | string) => {
					if (!columns.includes(key)) throw new InsightError("ORDER key must be in COLUMNS");
					if (key.includes("_")) orderFields.push(this.getField(key));
					else orderFields.push(key);
				});
			} else {
				if (typeof order !== "string") throw new InsightError("Invalid type for ORDER");
				if (!columns.includes(order)) throw new InsightError("ORDER key must be in COLUMNS");
				if (order.includes("_")) orderFields.push(this.getField(order));
				else orderFields.push(order);
			}
		}
		return { orderFields, dir };
	}

	/**
	 * Parses obj into a valid Transformation
	 * @param obj - transformations clause
	 * @private
	 */
	private parseTransformations(obj: unknown): Transformation | null {
		if (obj === null) return null;
		if (typeof obj !== "object" || Array.isArray(obj)) throw new InsightError("Invalid Transformation clause body");
		if (!Object.hasOwn(obj as any, "GROUP") || !Object.hasOwn(obj as any, "APPLY"))
			throw new InsightError("Missing clause in Transformations ");

		const { GROUP: keylist, APPLY: rules } = obj as any;

		const groupKeylist = this.parseGroup(keylist);
		const applyRules: ApplyRule[] = this.parseApply(rules);
		return new Transformation(new Group(groupKeylist), new Apply(applyRules));
	}

	private parseGroup(keylist: any): Array<any> {
		if (keylist === null || keylist.length === 0 || !Array.isArray(keylist))
			throw new InsightError("GROUP CLAUSE IS EMPTY OR MISSING");

		const res = [];
		for (const key of keylist) {
			if (typeof key !== "string") throw new InsightError("GROUP keys must be a string");
			const field: string = this.getField(key);
			if (!(field in MField || field in SField)) throw new InsightError("Invalid key in GROUP");

			this.transKeys.push(key);
			res.push(field);
		}
		return res;
	}

	private parseApply(rules: unknown): ApplyRule[] {
		const res: ApplyRule[] = [];
		const keysSoFar: Array<string> = [];
		if (!Array.isArray(rules)) {
			throw new InsightError("APPLY must be an array of rules");
		}
		for (const rule of rules as any) {
			if (typeof rule !== "object" || rule === null || Array.isArray(rule) || Object.entries(rule).length !== 1) {
				throw new InsightError("APPLY rule must be an object");
			}
			const [[applyKey, applyObj]] = Object.entries(rule);
			if (Object.entries(applyObj as any).length !== 1) throw new InsightError("Apply rule is empty");
			const [[applyToken, key]] = Object.entries(applyObj as any);
			if (typeof applyKey !== "string" || applyKey === "" || applyKey.includes("_")) {
				throw new InsightError("APPLY key must be a string and non-empty and not have underscore");
			}
			if (typeof key !== "string" || key === "") {
				throw new InsightError("APPLYTOKEN key must be a string and non-empty");
			}
			const field: string = this.getField(key as string);

			if (!(applyToken in ApplyToken)) throw new InsightError("Invalid Apply Token");
			if (!(field in MField || field in SField)) throw new InsightError("Invalid field");
			if (keysSoFar.includes(applyKey)) throw new InsightError("Duplicate Apply Keys found");
			keysSoFar.push(applyKey);

			res.push(new ApplyRule(applyKey, applyToken as ApplyToken, field as MField | SField));
		}
		this.transKeys = this.transKeys.concat(keysSoFar); // can use these keys for COLUMNS
		return res;
	}

	//REQUIRES: obj is an object
	//EFFECTS: Returns true if obj is an object false otherwise
	private isObject(obj: unknown): boolean {
		return typeof obj === "object";
	}

	//REQUIRES: prop is a string of a key and obj is the object to check
	//EFFECTS: Returns true if prop is a property of obj, false otherwise
	private isInObject(obj: unknown, prop: string): boolean {
		if (this.isObject(obj)) {
			return prop in (obj as Object);
		} else {
			return false;
		}
	}

	//This function is used for checking if an id is inconsistent throughout a query
	//REQUIRES: newId is new Id to be updated with
	//EFFECTS: sets id if datasetId is empty,
	// throws InsightError if newId doesn't match current Id
	private updateId(newId: string): void {
		if (this.datasetId === "") {
			this.datasetId = newId;
		} else if (this.datasetId !== newId) {
			throw new InsightError("Cannot query multiple datasets");
		}
	}

	//EFFECTS: Returns the datasetId
	public getDatasetId(): string {
		return this.datasetId;
	}
}
