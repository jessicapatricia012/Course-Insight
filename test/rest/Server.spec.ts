import { expect } from "chai";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { Log } from "@ubccpsc310/project-support";
import Server from "../../src/rest/Server";
import fs from "fs-extra";
import { clearDisk, loadTestQuery } from "../TestUtil";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Facade C3", function () {
	const port = 4321;
	let server: Server;
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

		fs.readFile("test/resources/archives/pair.zip", function (err, data) {
			if (err) throw err;
			sections = data;
		});

		fs.readFile("test/resources/archives/campus.zip", function (err, data) {
			if (err) throw err;
			campus = data;
		});
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
		// might want to add some process logging here to keep track of what is going on
		await clearDisk();
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	//PUT
	// Sample on how to format PUT requests
	it("should PUT a single sections dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA: any = sections;

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.be.equal(["sections"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should PUT a single rooms dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/rooms/rooms";
		const ZIP_FILE_DATA: any = campus;

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.be.equal(["rooms"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should PUT two datasets", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/rooms/rooms";
		const ENDPOINT_URL2 = "/dataset/sections/sections";
		const ZIP_FILE_DATA: any = campus;
		const ZIP_FILE_DATA2: any = sections;

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res.body.result).to.be.equal(["rooms"]);

			const res2 = await request(SERVER_URL)
				.put(ENDPOINT_URL2)
				.send(ZIP_FILE_DATA2)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res2.status).to.be.equal(StatusCodes.OK);
			// TODO add assertions that check res.body
			expect(res2.body.result).to.be.equal(["rooms", "sections"]);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT PUT dataset with repeated id", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA: any = sections;

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid PUT request with err body: ${res.body.err}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	//DELETE
	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
	it("should DELETE an existing dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ZIP_FILE_DATA = sections;
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/dataset/sections";

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.be.equal("sections");
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT DELETE an id with underscore", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/some_Id";

		try {
			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid DELETE request with err body: ${res.body.err}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should NOT DELETE an non-existing id", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/someId";

		try {
			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
			Log.test(`Successful invalid DELETE request with err body: ${res.body.err}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	//POST
	it("should POST simple Query", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const ZIP_FILE_DATA = sections;
		const { input, expected } = await loadTestQuery("[valid/simple.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

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
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const ZIP_FILE_DATA = sections;
		const { input, expected } = await loadTestQuery("[valid/validComplex.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

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
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/query";
		const ZIP_FILE_DATA = sections;
		const { input } = await loadTestQuery("[invalid/invalid.json]");

		try {
			const setup = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

			const res = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(input as object);
			expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
			Log.test(`Successful invalid POST request with err body: ${res.body.err}`);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should GET one dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL = "/datasets";
		const ZIP_FILE_DATA = sections;
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
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

			const res = await request(SERVER_URL).get(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});

	it("should GET two dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL_SETUP = "/dataset/sections/sections";
		const ENDPOINT_URL_SETUP2 = "/dataset/sections2/sections";
		const ENDPOINT_URL = "/datasets";
		const ZIP_FILE_DATA = sections;
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
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup.status).to.be.equal(StatusCodes.OK);
			expect(setup.body.result).to.be.equal(["sections"]);

			const setup2 = await request(SERVER_URL)
				.put(ENDPOINT_URL_SETUP2)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			expect(setup2.status).to.be.equal(StatusCodes.OK);
			expect(setup2.body.result).to.be.equal(["sections", "sections2"]);

			const res = await request(SERVER_URL).get(ENDPOINT_URL);
			expect(res.status).to.be.equal(StatusCodes.OK);
			expect(res.body.result).to.have.deep.members(expected);
		} catch (err) {
			Log.error(err);
			expect.fail();
		}
	});
});
