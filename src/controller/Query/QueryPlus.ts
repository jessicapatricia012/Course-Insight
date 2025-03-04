import { ApplyToken, MField, SField } from "./enums";
import { Room, Section } from "../Dataset/Dataset";
import { InsightError } from "../IInsightFacade";

type Things = Section[] | Room[];
export class Group {
	private keylist: Array<MField | SField>;

	constructor(keylist: Array<MField | SField>) {
		this.keylist = keylist;
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
 * Class representing an applyRule
 */
export class ApplyRule {
	public applyKey: string;
	public applyToken: ApplyToken;
	public key: MField | SField;
	private val: number[];

	constructor(applyKey: string, token: ApplyToken, key: MField | SField) {
		this.applyKey = applyKey;
		this.applyToken = token;
		this.key = key;
		this.val = []; //Buffer for holding result
	}

	public addVal(val: number): void {
		this.val.push(val);
	}
	public getVal(): number[] {
		return this.val;
	}
}

export class Apply {
	private rules: ApplyRule[];

	constructor(rules: ApplyRule[]) {
		this.rules = rules;
	}

	/**
	 * Applies all Apply rules into each group in  groups, the value is stored in the local rules' val field
	 * @param groups - and Array of arrays of sections or rooms
	 */
	public apply(groups: Section[][] | Room[][]): void {
		for (const rule of this.rules) {
			for (const group of groups) {
				this.handleApply(rule, group);
			}
		}
	}

	public getApplyRules(): ApplyRule[] {
		return this.rules;
	}

	/**
	 * Applies rule to group, the result is added to ApplyRule's val field
	 * @param rule
	 * @param group
	 * @private
	 */
	private handleApply(rule: ApplyRule, group: Things): void {
		const { applyToken, key } = rule;
		switch (applyToken) {
			case ApplyToken.MAX:
				rule.addVal(this.handleMax(group, key));
				break;
			case ApplyToken.MIN:
				rule.addVal(this.handleMin(group, key));
				break;
			case ApplyToken.AVG:
				rule.addVal(this.handleAvg(group, key));
				break;
			case ApplyToken.COUNT:
				rule.addVal(this.handleCount(group, key));
				break;
			case ApplyToken.SUM:
				rule.addVal(this.handleSum(group, key));
				break;
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
