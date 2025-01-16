import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let noSection: string;
	let notJson: string;
	let empty: string;
	let noResult: string;
	let blank: string;
	let emptyFolder: string;
	let nonZip: string;
	let missingField: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		noSection = await getContentFromArchives("noSection.zip");
		notJson = await getContentFromArchives("notJson.zip");
		empty = await getContentFromArchives("empty.zip");
		noResult = await getContentFromArchives("noResult.zip");
		blank = await getContentFromArchives("blank.zip");
		emptyFolder = await getContentFromArchives("emptyFolder.zip");
		nonZip = await getContentFromArchives("nonZip");
		missingField = await getContentFromArchives("missingField.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	beforeEach(async function () {
		await clearDisk();
		facade = new InsightFacade();
	});

	describe("AddDataset", function () {
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
			const result = await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
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

		it("should successfully add a dataset with whitespace and other character", async function () {
			const result = await facade.addDataset("ubc ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc ubc"]);
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

		// TESTS AGAINST CONTENT ///////////////////////////////////////////////////////////////
		it("should reject adding with invalid section", async function () {
			try {
				await facade.addDataset("ubc", noSection, InsightDatasetKind.Sections);
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
	});

	describe("removeDataset", function () {
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
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			// // TODO: replace this failing assertion with your assertions. You will need to reason about the code in this function
			// // to determine what to put here :)
			// return expect.fail("Write your assertion(s) here.");
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				//facade.addDataset("sections", sections, InsightDatasetKind.Sections),
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

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);

		it("[invalid/invalidKey.json] Query invalid key", checkQuery);
		it("[invalid/exceedResultLimit.json] Query exceeding result limit", checkQuery);
		it("[invalid/invalidOrderKey.json] Query with invalid ORDER key", checkQuery);
		it("[invalid/noColsOption.json] Query with no columns in OPTIONS", checkQuery);

		//wildcards
		it("[invalid/wildcardMiddle.json] Wildcard Middle", checkQuery);
		it("[invalid/invalidWildcard.json] Invalid Wildcard", checkQuery);
		it("[valid/noWildcard.json] No wildcard", checkQuery);
		it("[valid/wildcardEnd.json] wildcard at the end", checkQuery);
		it("[valid/wildcardStart.json] wildcard at the start", checkQuery);
		it("[valid/wildcardStartEnd.json] wildcard both start and end", checkQuery);

		it("[valid/emptyResult.json] Empty result", checkQuery);

		//ORDER
		it("[invalid/orderEmpty.json] ORDER Empty", checkQuery);
		it("[invalid/orderNotInCol.json] ORDER not in COLUMN", checkQuery);
		it("[valid/order1.json] ORDER 1", checkQuery);
		it("[valid/order2.json] ORDER 2", checkQuery);
		it("[valid/order3.json] ORDER 3", checkQuery);
		it("[valid/orderExist.json] ORDER exists", checkQuery);
		it("[valid/orderNone.json] ORDER doesnt exist", checkQuery);
		it("[valid/orderSingleCol.json] ORDER single COLUMN", checkQuery);

		it("[invalid/emptyQuery.json] Empty query", checkQuery);
	});
});
