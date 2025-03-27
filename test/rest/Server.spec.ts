import { expect } from "chai";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { Log } from "@ubccpsc310/project-support";
import Server from "../../src/rest/Server";
import fs from "fs-extra";
import { loadTestQuery } from "../TestUtil";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Facade C3", function () {
	const port = 4321;
	let server: Server;
	const SERVER_URL = "http://localhost:4321";
	let sections: any;
	let campus: any;

	before(async function () {
		// TODO: start server here once and handle errors properly
		server = new Server(port);
		try {
			await server.start();
		} catch (err) {
			throw new Error(`Server fail to start: \n${err}`);
		}
		//Read ZIP Files
		sections = await fs.readFile("test/resources/archives/pair.zip");
		campus = await fs.readFile("test/resources/archives/campus.zip");
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			await server.stop();
		} catch (err) {
			throw new Error(`Server fail to close: \n${err}`);
		}
	});

	beforeEach(async function () {
		//Clear memory and storage for next tests
		await request(SERVER_URL).delete("/dataset/sections");
		await request(SERVER_URL).delete("/dataset/rooms");
		await request(SERVER_URL).delete("/dataset/sections2");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	//PUT
	// Sample on how to format PUT requests
	it("should PUT a single sections dataset", async function () {
		const ENDPOINT_URL = "/dataset/sections/sections";

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.have.members(["sections"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should PUT a single rooms dataset", async function () {
		const ENDPOINT_URL = "/dataset/rooms/rooms";

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.have.members(["rooms"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should PUT two datasets", async function () {
		const ENDPOINT_URL = "/dataset/rooms/rooms";
		const ENDPOINT_URL2 = "/dataset/sections/sections";

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.have.members(["rooms"]);

			const res2 = await request(SERVER_URL)
				.put(ENDPOINT_URL2)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res2.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res2.body.result).to.have.members(["rooms", "sections"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT PUT dataset with repeated id", async function () {
		const ENDPOINT_URL = "/dataset/sections/sections";

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid PUT request with err body: ${res.body.erroror}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	//DELETE
	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
	it("should DELETE an existing dataset", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/dataset/sections";

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.be.equal("sections");
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT DELETE an id with underscore", async function () {
		const ENDPOINT_URL = "/dataset/some_Id";

		try {
			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid DELETE request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT DELETE an non-existing id", async function () {
		const ENDPOINT_URL = "/dataset/someId";

		try {
			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
			Log.test(`Successful invalid DELETE request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	//POST
	it("should POST simple Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[valid/simple.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST complex Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[valid/validComplex.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST valid rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/valid1.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST valid2 rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/valid2.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST valid3 rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/valid3.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST valid4 rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/valid4.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST valid5 rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/valid5.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST validApplyAvg rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/validApplyAvg.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should POST validApplyCountNumber rooms Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/rooms/rooms";
		const ENDPOINT_URL = "/query";
		const { input, expected } = await loadTestQuery("[c2/validApplyCountNumber.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(campus)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["rooms"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT POST invalid Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input } = await loadTestQuery("[invalid/invalid.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT POST invalidApplyAVGKeyType Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input } = await loadTestQuery("[c2/invalidApplyAVGKeyType.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT POST invalidApplyDuplicateKey Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input } = await loadTestQuery("[c2/invalidApplyDuplicateKey.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT POST invalidApplyKey Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input } = await loadTestQuery("[c2/invalidApplyKey.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT POST invalidApplyKey2 Query", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const { input } = await loadTestQuery("[c2/invalidApplyKey2.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.error}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should GET one dataset", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/datasets";
		const expected = [
			{
				id: "sections",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			},
		];

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const res = await request(SERVER_URL).get(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should GET two dataset", async function () {
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL_SETUP2 = "/dataset/sections2/sections";
		const ENDPOINT_URL = "/datasets";
		const expected = [
			{
				id: "sections",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			},
			{
				id: "sections2",
				kind: InsightDatasetKind.Sections,
				numRows: 64612,
			},
		];

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.have.members(["sections"]);

			const setup2 = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP2)
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup2.status).to.be.equal(StatusCodes.OK);
			expect(setup2.body.result).to.have.members(["sections", "sections2"]);

			const res = await request(SERVER_URL).get(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});
});
