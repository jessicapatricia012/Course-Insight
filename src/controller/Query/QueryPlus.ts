import { ApplyToken, MField, SField } from "./enums";
import { Room, Section } from "../Dataset/Dataset";
import { InsightError } from "../IInsightFacade";

type Things = Section[] | Room[];
export class Transformation {
	private group: Group;
	private apply: Apply;

	constructor(group: Group, apply: Apply) {
		this.group = group;
		this.apply = apply;
	}

	/**
	 * Returns a list of valid keys that can be used in COLUMNS
	 */
	public getValidKeys(): Array<string> {
		let res: Array<string> = [];

		const groupKeys = this.group.getKeyList();
		const applyKeys = this.apply.getRuleKeys();
		res = res.concat(groupKeys);
		res = res.concat(applyKeys);
		return res;
	}

	public transform(things: Things): Array<any> {
		const groups = this.group.group(things);
		const applyRes = this.apply.apply(groups);
		return this.flattenGroups(applyRes, this.group.getKeyList());
	}

	private flattenGroups(applyResults: ApplyResult[], groupKeys: Array<MField | SField>): Array<any> {
		const res = [];
		for (const appRes of applyResults) {
			const obj: any = {};
			const group = appRes.group;
			for (const key of groupKeys) {
				obj[key] = getKey(group[0], key);
			}
			for (const [key, value] of Object.entries(appRes)) {
				if (key === "group") continue;
				obj[key] = value;
			}
			res.push(obj);
		}
		return res;
	}
}

export class Group {
	private keylist: Array<MField | SField>;

	constructor(keylist: Array<MField | SField>) {
		this.keylist = keylist;
	}

	/**
	 * Returns the keylist of group
	 */
	public getKeyList(): Array<MField | SField> {
		return this.keylist;
	}

	/**
	 * Group things by keylist, note that each group is modified
	 * @param things - Array of sections or rooms to group
	 * @return an array of groups of sections or rooms
	 */
	public group(things: Things): any {
		let groups = [];
		groups.push(things);
		for (const key of this.keylist) {
			let split: Section[][] | Room[][] = [];
			for (const group of groups) {
				split = splitGroup(group, key);
				groups = groups.concat(split);
				groups.shift();
			}
		}
		return groups;
	}
}

/**
 * Splits group into multiple groups based on val of key, note that this function modifies group
 * @param group - An array of Section or Room
 * @param key - key to group by
 * @returns an Array of groups
 * @private
 */
function splitGroup(group: Things, key: MField | SField): Array<Section[]> | Array<Room[]> {
	const res = [];
	for (let i = 0; i < group.length; i++) {
		const newGroup = [];
		const thing = group[i];
		newGroup.push(thing);
		const val: string | number = getKey(thing, key);
		for (let j = i + 1; j < group.length; j++) {
			const thing2: any = group[j];
			const val2 = getKey(thing2, key);
			if (val === val2) {
				newGroup.push(thing2);
				group.splice(j, 1); //Removes thing2
				j--; //adjusts index
			}
		}
		res.push(newGroup);
	}
	return res;
}

/**
 * Returns the value of the field
 * @param thing  - A Section or Room
 * @param key - Key of Section or Room
 * @returns value of key
 * @private
 */
export function getKey(thing: Section | Room, key: MField | SField): string | number {
	if (!(key in thing)) throw new Error(`Invalid key: ${key} is not in ${typeof thing}`);
	return thing[key as keyof typeof thing];
}

/**
 * Class representing an apply rule
 */
export class ApplyRule {
	public applyKey: string;
	public applyToken: ApplyToken;
	public key: MField | SField;

	constructor(applyKey: string, token: ApplyToken, key: MField | SField) {
		this.applyKey = applyKey;
		this.applyToken = token;
		this.key = key;
	}
}

/**
 * An interface representing the result of Apply
 */
export interface ApplyResult {
	group: Array<any>;
	//The rest of the fields are results
	[key: string]: any;
}

export class Apply {
	private rules: ApplyRule[];

	constructor(rules: ApplyRule[]) {
		this.rules = rules;
	}

	/**
	 * Returns the list of applykeys in all apply rules
	 * @param rules
	 */
	public getRuleKeys(): Array<string> {
		const res: Array<string> = [];
		for (const rule of this.rules) {
			res.push(rule.applyKey);
		}
		return res;
	}

	/**
	 * Applies all Apply rules into each group in  groups, the value is stored in the local rules' val field
	 * @param groups - and Array of arrays of sections or rooms
	 */
	public apply(groups: Section[][] | Room[][]): Array<ApplyResult> {
		const res: ApplyResult[] = [];
		for (const group of groups) {
			const applyResult: ApplyResult = { group: [] };
			applyResult.group = applyResult.group.concat(group); //copy group into result
			for (const rule of this.rules) {
				const val: number = this.handleApply(rule, group);
				applyResult[rule.applyKey] = val;
			}
			res.push(applyResult);
		}
		return res;
	}

	/**
	 * Applies rule to group, the result is added to ApplyRule's val field
	 * @param rule
	 * @param group
	 * @private
	 */
	private handleApply(rule: ApplyRule, group: Things): number {
		const { applyToken, key } = rule;
		switch (applyToken) {
			case ApplyToken.MAX:
				return this.handleMax(group, key);
			case ApplyToken.MIN:
				return this.handleMin(group, key);
			case ApplyToken.AVG:
				return this.handleAvg(group, key);
			case ApplyToken.COUNT:
				return this.handleCount(group, key);
			case ApplyToken.SUM:
				return this.handleSum(group, key);
			default:
				throw new InsightError(`Invalid Apply token: ${rule}`);
		}
	}

	/**
	 * Returns the maximum value of key in the group, throws an InsightError if key's value is not a number type
	 * @param group - group to aggregate
	 * @param key - key used for aggregation
	 * @private
	 */
	private handleMax(group: Things, key: MField | SField): number {
		if (!(key in MField)) {
			throw new InsightError("Invalid key for MAX: A key of type number is required");
		}
		let max: number = getKey(group[0], key) as number;
		for (const thing of group) {
			const val: number = getKey(thing, key) as number;
			if (val > max) max = val;
		}
		return max;
	}

	/**
	 * Returns the min values of key in the group, throws an InsightError if key's value is not a number type
	 * @param group - group to aggregate
	 * @param key - key used for aggregation
	 * @private
	 */
	private handleMin(group: Things, key: MField | SField): number {
		if (!(key in MField)) {
			throw new InsightError("Invalid key for MIN: A key of type number is required");
		}
		let min: number = getKey(group[0], key) as number;
		for (const thing of group) {
			const val: number = getKey(thing, key) as number;
			if (val < min) min = val;
		}
		return min;
		return 0;
	}

	/**
	 * Returns the average of all the keys in group
	 * @param group - group to average over
	 * @param key - key used for avg
	 * @private
	 */
	private handleAvg(group: Things, key: MField | SField): number {
		if (!(key in MField)) {
			throw new InsightError("Invalid key for AVG: A key of type number is required");
		}
		const len: number = group.length;
		let sum: number = 0;
		for (const thing of group) {
			sum += getKey(thing, key) as number;
		}
		return Number((sum / len).toFixed(2));
	}

	/**
	 * Returns the count of unique occurences of
	 * @param group - Group to count
	 * @param key - key to count
	 * @private
	 */
	private handleCount(group: Things, key: MField | SField): number {
		const groups = splitGroup(group, key);
		return groups.length;
	}

	/**
	 * 	Returns the sum of key in group
	 * @param group - group to sum over
	 * @param key - key used for summing
	 * @private
	 */
	private handleSum(group: Things, key: MField | SField): number {
		if (!(key in MField)) {
			throw new InsightError("Invalid key for SUM: A key of type number is required");
		}
		let sum: number = 0;
		for (const thing of group) {
			sum += getKey(thing, key) as number;
		}
		return sum;
	}
}
