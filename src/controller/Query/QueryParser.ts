import {Filter, LComparison, MComparison, Negation, Query, SComparison, Where, Options} from "./Query";
import {InsightError} from "../IInsightFacade";
import {Logic, MComparator, MField, SField} from "./enums";


export class QueryParser{
	private datasetId: string;//to check consistent id throughout query

	constructor() {
		this.datasetId = ""//intialize id as empty first
	}
	public parseQuery(query:unknown): Query{

		if(!this.isObject(query)){
			throw new InsightError("Invalid Query type");
		}

		if (!(this.isInObject(query,"WHERE") && this.isInObject(query, "OPTIONS"))){
			throw new InsightError("Missing WHERE or OPTIONS Clause");
		}

		//Destructure WHERE and OPTIONS
		const{WHERE: whereObj, OPTIONS: optionsObj} = (query as any);

		const where:Where = new Where(this.parseFilter(whereObj));
		const options:Options = this.parseOptions(optionsObj);

		return new Query(where,options);
	}

	//Helper Functions

	//This is what is used to parse the body of the WHERE clause
	//REQUIRES: obj is an object representing a Filter
	//EFFECTS: Returns a Filter object representing the Filter
	private parseFilter(obj:unknown): Filter{
		let filter: Filter;
		if (!this.isObject(obj)){
			throw new InsightError("Invalid WHERE clause body");
		}

		if (this.isInObject(obj,"LT") || this.isInObject(obj,"GT") || this.isInObject(obj,"EQ")){
			filter = this.parseMComparison(Object.values(obj as Object)[0],
				Object.keys(obj as Object)[0] as MComparator);
		} else if (this.isInObject(obj,"IS")){
			filter = this.parseSComparison(Object.values(obj as Object)[0]);
		} else if (this.isInObject(obj,"NOT")){
			filter = this.parseNegation(Object.values(obj as Object)[0]);
		} else if (this.isInObject(obj,"AND") || this.isInObject(obj, "OR")) {//LComparison
			filter = this.parseLComparison(Object.values(obj as Object)[0],
				Object.keys(obj as Object)[0] as Logic);
		}
		filter = {} as Filter;//Empty filter if no match
		return filter;
	}

	//REQUIRES: obj is an object representing an MComparison and MComparator is the type of comparison
	//EFFECTS: Returns an MComparison representation of the object
	private parseMComparison(obj:unknown, mcomp: MComparator): MComparison{
		const key: string = Object.keys(obj as Object)[0];
		const keyTokens = key.split("_");
		if (keyTokens.length !== 2){
			throw new InsightError("Invalid format for MComparison key")
		}

		this.updateId(keyTokens[0]);
		const mfield: string = keyTokens[1];
		if (!(mfield in MField)){
			throw new InsightError("Invalid value for MField");
		}

		const val = Object.values(obj as Object)[1];
		if (typeof val !== "number"){
			throw new InsightError("Wrong value type for MComparison")
		}
		return new MComparison(mfield as MField, val, mcomp);
	}

	//REQUIRES: obj is an object representing an SComparison
	//EFFECTS: Return an SComparison representation of the object
	private parseSComparison(obj:unknown):SComparison{
		const key: string = Object.keys(obj as Object)[0];
		const keyTokens = key.split("_");
		if (keyTokens.length !== 2){
			throw new InsightError("Invalid format for SComparison key")
		}

		this.updateId(keyTokens[0]);
		const sfield:string = keyTokens[1];
		if (!(sfield in SField)){
			throw new InsightError("Invalid value for MField");
		}

		const val = Object.values(obj as Object)[1];
		if (typeof val !== "string"){
			throw new InsightError("Wrong value type for SComparison")
		}
		return new SComparison(sfield as SField, val as string);
	}
	//REQUIRES: obj is an object representing a Negation
	//EFFECTS: Return an Negation representation of the object
	private parseNegation(obj:unknown):Negation{
		return new Negation(this.parseFilter(obj));
	}
	//REQUIRES: obj is an object representing an LComparison, logic is the type of Logic to apply
	//EFFECTS: Returns an LComparison representation of the object
	private parseLComparison(obj:unknown, logic:Logic):LComparison{
		const filterList:Filter[] = [];
		for (const filter of (obj as Array<Object>)){
			filterList.push(this.parseFilter(filter));
		}
		return new LComparison(filterList, logic);
	}

	//REQUIRES: obj is an object representing an OPTIONS clause
	//EFFECTS: Returns an Options object representation of the clause
	private parseOptions(obj:unknown): Options{
		if(!this.isObject(obj))
			throw new InsightError("Invalid type for OPTIONS clause");
		if (!("COLUMNS" in (obj as Object)))
			throw new InsightError("Missing COLUMNS in OPTIONS");
		const{COLUMNS: columns, ORDER: order = null} = obj as any;//If ORDER doesn't exist, default value of null is assigned
		if (!(columns instanceof Array) || columns.length < 1)
			throw new InsightError("COLUMNS is not an array or COLUMNS is empty")
		const fields: Array<MField | SField> = [];//List of fields in COLUMNS
		for (const key of columns){
			const keyTokens = key.split("_");
			if (keyTokens.length !== 2)
				throw new InsightError("Invalid format for COLUMNS");
			this.updateId(keyTokens[0]);
			const field: string = keyTokens[1];
			if (field in MField){
				fields.push(field as MField);
			} else if (field in SField){
				fields.push(field as SField);
			} else {
				throw new InsightError("invalid field type for COLUMNS");
			}
		}
		let orderField: string = "";
		if (order !== null){
			const orderTokens = order.split("_");
			if (orderTokens.length !== 2)
				throw new InsightError("Invalid format for ORDER");
			this.updateId(orderTokens[0]);
			orderField = orderTokens[1];
		}
		return new Options(this.datasetId, fields, orderField as (MField | SField));
	}

	//REQUIRES: obj is an object
	//EFFECTS: Returns true if obj is an object false otherwise
	private isObject(obj:unknown):boolean{
		return (typeof obj === "object");
	}

	//REQUIRES: prop is a string of a key and obj is the object to check
	//EFFECTS: Returns true if prop is a property of obj, false otherwise
	private isInObject(obj: unknown, prop:string): boolean{
		if (this.isObject(obj)){
			return (prop in (obj as Object));
		} else{
			return false;
		}
	}

	//This function is used for checking if an id is inconsistent throughout a query
	//REQUIRES: newId is new Id to be updated with
	//EFFECTS: sets id if datasetId is empty,
	// throws InsightError if newId doesn't match current Id
	private updateId(newId:string):void {
		if(this.datasetId === ""){
			this.datasetId = newId;
		} else if (this.datasetId !== newId){
			throw new InsightError("Cannot query multiple datasets")
		}
	}

	//EFFECTS: Returns the datasetId
	public getDatasetId():string{
		return this.datasetId
	}
}


