import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as fs from "fs-extra";
import { Apply, ApplyRule, Group, Transformation } from "../../src/controller/Query/QueryPlus";
import { Dataset } from "../../src/controller/Dataset/Dataset";
import { QueryParser } from "../../src/controller/Query/QueryParser";
import { Query } from "../../src/controller/Query/Query";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

export interface GroupTest {
	name?: string;
	keylist: any;
	input: any;
	expected: any;
}

export interface ApplyTest {
	name?: string;
	rules: any;
	input: any;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;
	let facade1: IInsightFacade;
	let facade2: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let smallPair: string;
	let noSection: string;
	let noSectionTwo: string;
	let notJson: string;
	let empty: string;
	let noResult: string;
	let blank: string;
	let emptyFolder: string;
	let nonZip: string;
	let missingField: string;
	let missingFieldTwo: string;
	let txtFormat: string;
	let wrongFolderName: string;
	let oneValidSection: string;
	let skipFolder: string;

	let campus: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		smallPair = await getContentFromArchives("smallPair.zip");
		noSection = await getContentFromArchives("noSection.zip");
		noSectionTwo = await getContentFromArchives("noSectionTwo.zip");
		notJson = await getContentFromArchives("notJson.zip");
		empty = await getContentFromArchives("empty.zip");
		noResult = await getContentFromArchives("noResult.zip");
		blank = await getContentFromArchives("blank.zip");
		emptyFolder = await getContentFromArchives("emptyFolder.zip");
		nonZip = await getContentFromArchives("nonzip");
		missingField = await getContentFromArchives("missingField.zip");
		missingFieldTwo = await getContentFromArchives("missingFieldTwo.zip");
		txtFormat = await getContentFromArchives("txtFormat.zip");
		wrongFolderName = await getContentFromArchives("wrongFolderName.zip");
		oneValidSection = await getContentFromArchives("oneValidSection.zip");
		skipFolder = await getContentFromArchives("skipFolder.zip");

		campus = await getContentFromArchives("campus.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		// ROOM /////////////////////////
		it("should successfully add a room datasets", async function () {
			const result = await facade.addDataset("ubc room", campus, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["ubc room"]);
		});

		// TESTS FOR ID ///////////////////////////////////////////////////////////////////////////
		it("should reject adding with  an empty dataset id", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset (first)", async function () {
			const result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should successfully add two datasets", async function () {
			await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);
			const result = await facade.addDataset("ubc2", smallPair, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc1", "ubc2"]);
		});

		it("should successfully add more than two datasets", async function () {
			await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
			const result = await facade.addDataset("ubc3", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc1", "ubc2", "ubc3"]);
		});

		it("should reject adding with id that starts with _", async function () {
			try {
				await facade.addDataset("_ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with id that ends with _", async function () {
			try {
				await facade.addDataset("ubc_", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with id that has _ in between", async function () {
			try {
				await facade.addDataset("u_bc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with id that is only whitespace", async function () {
			try {
				await facade.addDataset(" ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with id that is only whitespace (second)", async function () {
			try {
				await facade.addDataset("            ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset with whitespace and other character", async function () {
			const result = await facade.addDataset("ubc ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc ubc"]);
		});

		it("should successfully add a dataset with whitespace and other character (second)", async function () {
			const result = await facade.addDataset(" ubc ubc ", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members([" ubc ubc "]);
		});

		it("should reject with id that is the same as the id of an already added dataset", async function () {
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});
		// END OF TESTS FOR ID /////////////////////////////////////////////////////////////////

		// TESTS FOR CONTENT ///////////////////////////////////////////////////////////////
		it("should reject adding with no valid section", async function () {
			try {
				await facade.addDataset("ubc", noSection, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with no valid section (2)", async function () {
			try {
				await facade.addDataset("ubc", noSectionTwo, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with invalid course (not json format)", async function () {
			try {
				await facade.addDataset("ubc", notJson, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with empty zip (no course/ folder)", async function () {
			try {
				await facade.addDataset("ubc", empty, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with no result key", async function () {
			try {
				await facade.addDataset("ubc", noResult, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with blank file", async function () {
			try {
				await facade.addDataset("ubc", blank, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with empty Course folder", async function () {
			try {
				await facade.addDataset("ubc", emptyFolder, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with non-zip file format", async function () {
			try {
				await facade.addDataset("ubc", nonZip, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with missing field (invalid section)", async function () {
			try {
				await facade.addDataset("ubc", missingField, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with missing field (invalid section) 2", async function () {
			try {
				await facade.addDataset("ubc", missingFieldTwo, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with no content", async function () {
			try {
				await facade.addDataset("ubc", "", InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with other format", async function () {
			try {
				await facade.addDataset("ubc", txtFormat, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject adding with wrong folder name (not /courses)", async function () {
			try {
				await facade.addDataset("ubc", wrongFolderName, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset with one valid section", async function () {
			const result = await facade.addDataset("ubc", oneValidSection, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should reject adding with no folder (straight to jsons)", async function () {
			try {
				await facade.addDataset("ubc", skipFolder, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});
	});

	describe("removeDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		// TESTS FOR ID ///////////////////////////////////////////////////////////////////////////
		it("should reject removing with  an empty dataset id", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully remove a dataset (first)", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("ubc");
			expect(result).to.equal("ubc");
		});

		it("should reject removing a dataset id that has been removed", async function () {
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("ubc");
				await facade.removeDataset("ubc");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(NotFoundError);
			}
		});

		it("should reject removing with id that has _", async function () {
			try {
				await facade.removeDataset("_ubc");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}

			try {
				await facade.removeDataset("ubc_");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}

			try {
				await facade.removeDataset("u_bc");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject with id that is only whitespace", async function () {
			facade = new InsightFacade();

			try {
				await facade.removeDataset(" ");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully remove a dataset with whitespace and other character", async function () {
			await facade.addDataset("ubc ubc", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("ubc ubc");
			expect(result).to.equal("ubc ubc");
		});

		it("should reject with id that is not yet added", async function () {
			facade = new InsightFacade();

			try {
				await facade.removeDataset("notyetadded");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(NotFoundError);
			}
		});
		// END OF TESTS FOR ID /////////////////////////////////////////////////////////////////
	});

	describe("listDatasets", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});
		it("should successfully list a dataset", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			const expected = [
				{
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			expect(result).to.deep.equal(expected);
		});

		it("should successfully list two datasets", async function () {
			await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			const expected = [
				{
					id: "ubc1",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
				{
					id: "ubc2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			expect(result).to.deep.equal(expected);
		});

		it("should successfully list when no dataset has been added", async function () {
			const result = await facade.listDatasets();
			expect(result).to.deep.equal([]);
		});
	});

	describe("Group", function () {
		/**
		 * Loads group test
		 * @param filename - name of file
		 */
		async function loadGroupTest(filename: string): Promise<GroupTest> {
			const data = await fs.readFile(`test/resources/queries/GroupTest/${filename}`, "utf-8");
			const groupTest: any = JSON.parse(data);
			assertGroupTest(groupTest);
			return groupTest;
		}

		/**
		 * Type check groupTest
		 * @param groupTest
		 */
		function assertGroupTest(groupTest: any): asserts groupTest is GroupTest {
			if (Array.isArray(groupTest)) {
				throw new Error("ValidationError: Test Group must be an object not an array.");
			}
			if (!Object.hasOwn(groupTest, "input")) {
				throw new Error("ValidationError: Test Group is missing required field 'input'.");
			}
			if (!Object.hasOwn(groupTest, "expected")) {
				throw new Error("ValidationError: Test Group is missing required field 'expected'.");
			}
			if (!Object.hasOwn(groupTest, "keylist")) {
				throw new Error("ValidationError: Test Group is missing required field 'keylist'.");
			}
		}

		/**
		 * Tests the group function from the Group class
		 * @param filename
		 */
		async function checkGroup(filename: string): Promise<void> {
			const { keylist, input, expected } = await loadGroupTest(filename);
			const group = new Group(keylist);

			const res = group.group(input);
			expect(res).to.have.deep.members(expected);
		}

		it("Should group by one key", async function () {
			await checkGroup("test1.json");
		});

		it("should group by two keys", async function () {
			await checkGroup("test2.json");
		});
	});

	describe("Apply", async function () {
		async function loadApplyTest(filename: string): Promise<ApplyTest> {
			const data = await fs.readFile(`test/resources/queries/ApplyTest/${filename}`, "utf-8");
			const applyTest: any = JSON.parse(data);
			assertApplyTest(applyTest);
			return applyTest;
		}

		function assertApplyTest(applyTest: any): asserts applyTest is ApplyTest {
			if (Array.isArray(applyTest)) {
				throw new Error("ValidationError: Test Apply must be an object not an array.");
			}
			if (!Object.hasOwn(applyTest, "input")) {
				throw new Error("ValidationError: Test Apply is missing required field 'input'.");
			}
			if (!Object.hasOwn(applyTest, "expected")) {
				throw new Error("ValidationError: Test Apply is missing required field 'expected'.");
			}
			if (!Object.hasOwn(applyTest, "rules")) {
				throw new Error("ValidationError: Test Apply is missing required field 'rules'.");
			}
		}

		async function checkApply(filename: string): Promise<void> {
			const { rules, input, expected } = await loadApplyTest(filename);
			const rulesObj: ApplyRule[] = [];
			rules.forEach((rule: any) => {
				rulesObj.push(new ApplyRule(rule.applyKey, rule.applyToken, rule.key));
			});
			const apply: Apply = new Apply(rulesObj);
			const res = apply.apply(input);
			expect(res).to.have.deep.members(expected);
		}
		it("Should work with MAX", async function () {
			await checkApply("test1.json");
		});

		it("Should work with MIN", async function () {
			await checkApply("test2.json");
		});

		it("Should work with AVG", async function () {
			await checkApply("test3.json");
		});

		it("Should work with SUM", async function () {
			await checkApply("test4.json");
		});

		it("Should work with COUNT", async function () {
			await checkApply("test5.json");
		});

		it("Should work with two groups", async function () {
			await checkApply("test6.json");
		});
	});

	describe("Transformations", async function () {
		async function loadTransTest(filename: string): Promise<any> {
			const data = await fs.readFile(`test/resources/queries/TransformationTest/${filename}`, "utf-8");
			const transTest: any = JSON.parse(data);
			return transTest;
		}

		async function checkTransformation(filename: string): Promise<void> {
			const { keylist, rules, input, expected } = await loadTransTest(filename);
			const rulesObj: ApplyRule[] = [];
			rules.forEach((rule: any) => {
				rulesObj.push(new ApplyRule(rule.applyKey, rule.applyToken, rule.key));
			});

			const trans: Transformation = new Transformation(new Group(keylist), new Apply(rulesObj));
			const res = trans.transform(input);
			expect(res).to.have.deep.members(expected);
		}

		it("Should pass a simple example", async function () {
			await checkTransformation("test1.json");
		});

		it("Should pass a more complicated example", async function () {
			await checkTransformation("test2.json");
		});
	});

	describe("QueryParser", async function () {
		async function loadParseTest(filename: string): Promise<any> {
			const data = await fs.readFile(`test/resources/queries/ParseTest/${filename}`, "utf-8");
			const parseTest: any = JSON.parse(data);
			return parseTest;
		}

		it("Should parse simple query", async function () {
			const { input, query, expected } = await loadParseTest("test1.json");
			const parser: QueryParser = new QueryParser();
			const queryObj: Query = parser.parseQuery(query);
			const res: Array<any> = queryObj.query(input);
			expect(res).to.have.deep.members(expected);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned

			try {
				result = await facade.performQuery(input);

				//////////
				if (errorExpected) {
					// If error was expected but no error occurred, fail the test
					return expect.fail("performQuery resolved when it should have rejected with ${expected}");
				}
				// console.log(result);
				// console.log(expected);
				expect(result).to.deep.equal(expected);
			} catch (err) {
				if (!errorExpected) {
					return expect.fail(`performQuery threw unexpected error: ${err}`);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.an.instanceOf(ResultTooLargeError);
				} else if (expected === "InsightError") {
					expect(err).to.be.an.instanceOf(InsightError);
				} else {
					return expect.fail("Write your assertion(s) here.");
				}

				return;
			}
		}

		before(async function () {
			await clearDisk();
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				//facade.addDataset("sections2", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", campus, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});
		//Max
		it("[c2/maxTest.json] valid", checkQuery);
		it("[c2/maxTest2.json] valid", checkQuery);

		it("[c2/validSort.json] valid sort DOWN", checkQuery);
		it("[c2/valid1.json] valid", checkQuery);
		it("[c2/valid2.json] valid", checkQuery);
		it("[c2/valid3.json] valid", checkQuery);
		it("[c2/valid4.json] valid", checkQuery);
		it("[c2/valid5.json] valid", checkQuery);

		// TRANSFORMATIONS and SORTING
		it("[c2/validSimple.json] valid example simple", checkQuery);
		it("[c2/validComplex.json] valid example complex", checkQuery);
		it("[c2/validComplex2.json] valid example complex 2", checkQuery);
		it("[c2/validEmptyWhere.json] valid large data", checkQuery);

		it("[c2/invalidApplyDuplicateKey.json] Invalid APPLY duplicate key", checkQuery);
		it("[c2/invalidApplyKey.json] invalid applykey", checkQuery);
		it("[c2/invalidApplyKeyEmpty.json]  invalid applykey empty", checkQuery);
		it("[c2/invalidApplyNotArray.json]  invalid APPLY not array", checkQuery);
		it("[c2/invalidApplyToken.json]  invalid APPLYTOKEN", checkQuery);
		it("[c2/invalidApplyTokenKeyEmpty.json] invalid APPLYTOKEN KEY empty", checkQuery);
		it("[c2/invalidApplyAVGKeyType.json] invalid APPLYTOKEN KEY type", checkQuery);
		it("[c2/invalidApplySUMKeyType.json] invalid APPLYTOKEN KEY type", checkQuery);
		it("[c2/invalidApplyMINKeyType.json] invalid APPLYTOKEN KEY type", checkQuery);
		it("[c2/invalidApplyMAXKeyType.json] invalid APPLYTOKEN KEY type", checkQuery);
		it("[c2/invalidColumnKeyType.json] invalid COLUMNS key type", checkQuery);
		it("[c2/invalidColumnsKey.json] invalid COLUMNS key", checkQuery);
		it("[c2/invalidColumnsKeyEmptyString.json] invalid COLUMNS key empty string", checkQuery);
		it("[c2/invalidColGroup.json] invalid COLUMNS key empty string", checkQuery);

		it("[c2/invalidGroupEmpty.json] invalid empty GROUP", checkQuery);
		it("[c2/invalidOrder.json] invalid ORDER", checkQuery);
		it("[c2/invalidOrderDirection.json] invalid direction", checkQuery);
		it("[c2/invalidOrderEmpty.json] invalid empty ORDER", checkQuery);
		it("[c2/invalidOrderKeyNotInColumn.json] invalid ORDER key not in COLUMN", checkQuery);
		it("[c2/invalidOrderMissingDir.json] ORDER missing dir", checkQuery);
		it("[c2/invalidOrderMissingKey.json] ORDER missing key", checkQuery);
		it("[c2/invalidRoomKey.json] invalid room key", checkQuery);

		it("[c2/validApplyAvg.json] AVG", checkQuery);
		it("[c2/validApplyCountNumber.json] COUNT", checkQuery);
		it("[c2/validApplyCountString.json] COUNT", checkQuery);
		it("[c2/validApplyMax.json] MAX", checkQuery);
		it("[c2/validApplyMin.json] MIN", checkQuery);
		it("[c2/validApplyRuleMultiple.json] Multiple apply rule", checkQuery);
		it("[c2/validApplySum.json] SUM", checkQuery);
		it("[c2/validRoomAllFields.json] valid room all fields", checkQuery);
		it("[c2/invalid2.json] invalid dir", checkQuery);
		it("[c2/invalid3.json] empty transformations", checkQuery);
		it("[c2/invalid5.json] transformations missing clause", checkQuery);
		it("[c2/invalidApplyKey2.json] Apply Key contains underscore", checkQuery);
		it("[c2/invalidColumns.json] Columns outside of Group or Apply", checkQuery);

		it("[c2/validEmpty.json] valid empty", checkQuery);
		it("[c2/validDirDown.json] valid DOWN", checkQuery);
		it("[c2/validDirUp.json] valid UP", checkQuery);

		it("[c2/invalid1.json] invalid", checkQuery);
		it("[c2/invalid2.json] invalid", checkQuery);
		it("[c2/invalid3.json] invalid", checkQuery);
		it("[c2/invalid4.json] invalid", checkQuery);
		it("[c2/invalid5.json] invalid", checkQuery);
		it("[c2/invalid6.json] invalid", checkQuery);
		it("[c2/invalid7.json] invalid", checkQuery);
		it("[c2/invalid8.json] invalid", checkQuery);
		it("[c2/invalid9.json] invalid", checkQuery);
		it("[c2/invalid10.json] invalid", checkQuery);
		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery); //
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);

		//New Ones with Transformation on Sections
		it("[valid/trans1.json] Avg", checkQuery);
		it("[valid/trans2.json] Min", checkQuery);
		it("[valid/trans3.json] Min", checkQuery);
		it("[valid/trans4.json] Sum", checkQuery);
		it("[valid/trans5.json] Max Min Complex", checkQuery);

		//With transformations on
		it("[valid/transRoom1.json] Simple Room Avg", checkQuery);
		it("[valid/transRoom2.json] Simple Room Avg", checkQuery);

		it("[invalid/exceedResultLimit.json] Query exceeding result limit", checkQuery);
		it("[invalid/emptyWhere.json] Query exceeding result limit empty WHERE", checkQuery);
		it("[valid/emptyResult.json] Empty result", checkQuery);
		it("[invalid/emptyQuery.json] Empty query", checkQuery);
		it("[invalid/wrongType.json] Wrong type", checkQuery);
		it("[invalid/twoDatasets.json] Query references two datasets", checkQuery);
		it("[invalid/nullQuery.json] null query", checkQuery);
		it("[invalid/nullWhere.json] null query", checkQuery);
		it("[invalid/nullOption.json] null query", checkQuery);
		it("[invalid/invalidID.json] Invalid ID (ID not yet added)", checkQuery);

		//wildcards
		it("[invalid/wildcardMiddle.json] Wildcard Middle", checkQuery);
		it("[invalid/invalidWildcard.json] Invalid Wildcard", checkQuery);
		it("[valid/noWildcard.json] No wildcard", checkQuery);
		it("[valid/wildcardEnd.json] wildcard at the end", checkQuery);
		it("[valid/wildcardStart.json] wildcard at the start", checkQuery);
		it("[valid/wildcardStartEnd.json] wildcard both start and end", checkQuery);

		//ORDER
		it("[invalid/orderEmpty.json] ORDER Empty", checkQuery);
		it("[invalid/orderNotInCol.json] ORDER not in COLUMN", checkQuery);
		it("[valid/orderEmptyResult.json] ORDER empty result", checkQuery);
		it("[valid/order1.json] ORDER by mfield (avg)", checkQuery);
		it("[valid/order2.json] ORDER by sfield (title)", checkQuery);
		it("[valid/orderExist.json] ORDER exists", checkQuery);
		it("[valid/orderNone.json] ORDER doesnt exist", checkQuery);
		it("[valid/orderSingleCol.json] ORDER single COLUMN", checkQuery);
		it("[invalid/invalidOrder.json] Invalid order", checkQuery);

		//KEYS
		it("[invalid/invalidOrderKey.json] Query with invalid ORDER key", checkQuery);
		it("[invalid/noColsOption.json] Query with no columns in OPTIONS", checkQuery);
		it("[invalid/invalidKey.json] Query invalid key", checkQuery);
		it("[invalid/invalidKeyNoUnderscore.json] Invalid key missing underscore", checkQuery);
		it("[invalid/invalidField.json] Invalid field", checkQuery);
		it("[invalid/noUnderscore.json] Invalid key no underscore", checkQuery);
		it("[invalid/invalidKey2.json] Invalid Key 2", checkQuery);

		// WHERE AND NOT FILTER KEY
		it("[invalid/invalidFilterKey.json] Invalid filter key after NOT", checkQuery);
		it("[invalid/invalidFilterKey2.json] Invalid filter key after WHERE", checkQuery);
		it("[invalid/invalidFilterKey3.json]  Invalid filter key after NOT 2", checkQuery);
		it("[invalid/invalidFilterKey4.json] Invalid filter key after WHERE 2", checkQuery);
		it("[invalid/invalidNOT.json] invalid NOT", checkQuery);

		// // LOGIC
		it("[invalid/invalidAnd.json] invalid AND", checkQuery);
		it("[invalid/invalidAnd2.json] invalid AND 2", checkQuery);
		it("[invalid/invalidAnd3.json] invalid AND 3", checkQuery);
		it("[invalid/emptyAND.json] empty AND", checkQuery);
		it("[invalid/invalidOr.json] invalid OR", checkQuery);
		it("[invalid/invalidOr2.json] invalid OR 2", checkQuery);
		it("[invalid/invalidOr3.json] invalid OR 3", checkQuery);
		it("[invalid/emptyOR.json] empty OR", checkQuery);

		// MCOMPARISON
		it("[invalid/invalidEQ.json] Invalid key type in EQ", checkQuery);
		it("[invalid/invalidKeyEQ.json] Invalid key type in EQ", checkQuery);
		it("[invalid/invalidKeyGT.json] Invalid key type in GT", checkQuery);
		it("[invalid/invalidValueGT.json] Invalid value GT", checkQuery);
		it("[invalid/invalidValueLT.json] Invalid value LT", checkQuery);

		// SCOMPARISON
		it("[invalid/invalidIs.json] invalid IS 1", checkQuery);
		it("[invalid/invalidIs2.json] invalid IS 2", checkQuery);

		// COLUMNS
		it("[invalid/invalidCols.json] Invalid cols", checkQuery);
		it("[invalid/noColsOption2.json] No cols in OPTION 2", checkQuery);
		it("[invalid/invalidField2.json] Invalid field in COLUMNS", checkQuery);

		// VALID COMPLEX
		it("[valid/validComplex.json] Complex valid", checkQuery);
		it("[valid/EBNF1.json] EBNF with NOT", checkQuery);
		it("[valid/EBNF2.json] EBNF with double NOT", checkQuery);
		it("[valid/EBNF3.json] EBNF 3", checkQuery);
		it("[valid/EBNF4.json] EBNF 4", checkQuery);
		it("[valid/EBNF5.json] EBNF 5", checkQuery);
		it("[valid/EBNF6.json] EBNF 6", checkQuery);
		it("[valid/EBNF7.json] EBNF 7", checkQuery);
		it("[valid/EBNF8.json] EBNF 8", checkQuery);
		it("[valid/EBNF9.json] EBNF 9", checkQuery);
		it("[valid/EBNF10.json] EBNF 10", checkQuery);
		it("[valid/EBNF11.json] EBNF 11", checkQuery);
		it("[invalid/A.json] EBNF A", checkQuery);
		it("[validNew/EQ1.json] EQ1", checkQuery); //
		it("[validNew/EQ2.json] EQ2", checkQuery);
		it("[validNew/EQ3.json] EQ3", checkQuery);
		it("[validNew/EQ4.json] EQ4", checkQuery);
		it("[validNew/EQ5.json] EQ5", checkQuery);

		it("[validNew/GT1.json] GT1", checkQuery);
		it("[validNew/GT2.json] GT2", checkQuery);
		it("[validNew/GT3.json] GT3", checkQuery);
		it("[validNew/GT4.json] GT4", checkQuery);
		it("[validNew/GT5.json] GT5", checkQuery);

		it("[validNew/LT1.json] LT1", checkQuery);
		it("[validNew/LT2.json] LT2", checkQuery);
		it("[validNew/LT3.json] LT3", checkQuery);
		it("[validNew/LT4.json] LT4", checkQuery);
		it("[validNew/LT5.json] LT5", checkQuery);

		it("[validNew/IS1.json] IS1", checkQuery);
		it("[validNew/IS2.json] IS2", checkQuery);
		it("[validNew/IS3.json] IS3", checkQuery);
		it("[validNew/IS32.json] IS32", checkQuery);
		it("[validNew/IS4.json] IS4", checkQuery);
		it("[validNew/IS5.json] IS5", checkQuery);

		it("[validNew/NOT1.json] NOT 1", checkQuery);
		it("[validNew/NOT2.json] NOT 2", checkQuery);
		it("[validNew/NOT3.json] NOT 3", checkQuery);
		it("[validNew/NOT4.json] NOT 4", checkQuery);

		it("[validNew/OR1.json] OR 1", checkQuery);
		it("[validNew/OR2.json] OR 2", checkQuery);
		it("[validNew/OR3.json] OR 3", checkQuery);
		it("[validNew/OR4.json] OR 4", checkQuery);

		it("[validNew/AND1.json] AND", checkQuery);
	});

	describe("Caching", function () {
		beforeEach(async function () {
			await clearDisk();
			facade1 = new InsightFacade();
			facade2 = new InsightFacade();
			facade = new InsightFacade();
		});

		afterEach(async function () {});

		it("should reject adding id added by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully remove id added by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				const result = await facade2.removeDataset("ubc");
				expect(result).to.equal("ubc");
			} catch {
				expect.fail("Should not have thrown!");
			}
		});

		it("should successfully add id removed by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.removeDataset("ubc");
				const result = await facade2.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect(result).to.have.members(["ubc"]);
			} catch {
				expect.fail("Should not have thrown!");
			}
		});

		it("should successfully add id removed by another object 2", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.removeDataset("ubc");
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.removeDataset("ubc");
				const result = await facade2.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect(result).to.have.members(["ubc"]);
			} catch {
				expect.fail("Should not have thrown!");
			}
		});

		it("should successfully list id added by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				const result = await facade2.listDatasets();
				const expected = [
					{
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				];
				expect(result).to.deep.equal(expected);
			} catch {
				expect.fail("Should not have thrown!");
			}
		});

		it("should successfully to list [] after id removed by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.removeDataset("ubc");
				const result = await facade1.listDatasets();
				expect(result).to.deep.equal([]);
			} catch {
				expect.fail("Should have thrown!");
			}
		});

		it("should fail removing id removed by another object", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade2.removeDataset("ubc");
				await facade1.removeDataset("ubc");

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(NotFoundError);
			}
		});
		it("should fail removing id removed by another object 2", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade1.removeDataset("ubc");
				await facade2.removeDataset("ubc");

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(NotFoundError);
			}
		});

		it("should", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade1.listDatasets();

				const result = await facade2.removeDataset("ubc");
				expect(result).to.equal("ubc");
				await facade1.addDataset("ubc", campus, InsightDatasetKind.Rooms);
				await facade1.removeDataset("ubc");
			} catch (err) {
				expect.fail("Should not have thrown: " + err);
			}
			try {
				await facade2.removeDataset("ubc");

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(NotFoundError);
			}
			try {
				await facade1.addDataset("ubc", campus, InsightDatasetKind.Rooms);
			} catch (err) {
				expect.fail("Should not have thrown: " + err);
			}
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully complex", async function () {
			try {
				await facade1.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await facade1.listDatasets();

				const result = await facade2.removeDataset("ubc");
				expect(result).to.equal("ubc");
			} catch (err) {
				expect.fail("Should not have thrown: " + err);
			}
		});

		it("should successfully add add list", async function () {
			try {
				await facade1.addDataset("ubc1", sections, InsightDatasetKind.Sections);
				await facade2.addDataset("ubc2", sections, InsightDatasetKind.Sections);
				const result = await facade1.listDatasets();
				const expected = [
					{
						id: "ubc1",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
					{
						id: "ubc2",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				];
				expect(result).to.deep.equal(expected);
				const result2 = await facade2.listDatasets();
				const expected2 = [
					{
						id: "ubc1",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
					{
						id: "ubc2",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				];
				expect(result2).to.deep.equal(expected2);
			} catch {
				expect.fail("Should not have thrown!");
			}
		});

		it("should successfully perform after added", async function () {
			await facade2.addDataset("sections", sections, InsightDatasetKind.Sections);
			const { input, expected, errorExpected } = await loadTestQuery("[valid/EBNF10.json] EBNF 10");
			let result: InsightResult[] = [];
			try {
				result = await facade1.performQuery(input);
				//////////
				if (errorExpected) {
					// If error was expected but no error occurred, fail the test
					return expect.fail("performQuery resolved when it should have rejected with ${expected}");
				}
				// console.log(result);
				// console.log(expected);
				expect(result).to.have.deep.members(expected);
				/////////////
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.an.instanceOf(ResultTooLargeError);
				} else if (expected === "InsightError") {
					expect(err).to.be.an.instanceOf(InsightError);
				} else {
					return expect.fail("Write your assertion(s) here.");
				}
			}
		});

		it("should fail perform after removed", async function () {
			await facade1.addDataset("sections", sections, InsightDatasetKind.Sections);
			await facade2.removeDataset("sections");
			const { input } = await loadTestQuery("[valid/EBNF10.json] EBNF 10");
			try {
				await facade1.performQuery(input);

				expect.fail("should have thrown");
				/////////////
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should fail to add room with same id as section", async function () {
			try {
				await facade1.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade1.addDataset("sections", campus, InsightDatasetKind.Rooms);

				expect.fail("should have thrown");
				/////////////
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should successfully perform after added (room)", async function () {
			await facade2.addDataset("rooms", campus, InsightDatasetKind.Rooms);
			const { input, expected, errorExpected } = await loadTestQuery("[c2/validRoomAllFields.json] valid");
			let result: InsightResult[] = [];
			try {
				result = await facade1.performQuery(input);
				//////////
				if (errorExpected) {
					// If error was expected but no error occurred, fail the test
					return expect.fail("performQuery resolved when it should have rejected with ${expected}");
				}
				// console.log(result);
				// console.log(expected);
				expect(result).to.have.deep.members(expected);
				/////////////
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.an.instanceOf(ResultTooLargeError);
				} else if (expected === "InsightError") {
					expect(err).to.be.an.instanceOf(InsightError);
				} else {
					return expect.fail("Write your assertion(s) here.");
				}
			}
		});
	});
});

// tests for coverage
describe("Dataset", function () {
	let datasets: Dataset[];

	describe("getDatasetWithId", async function () {
		beforeEach(async function () {
			datasets = [];
		});

		it("should throws an error when id not found", function () {
			try {
				Dataset.getDatasetWithId("ashgb", datasets);
			} catch (err) {
				expect(err).to.be.an.instanceOf(Error);
			}
		});
	});
});
