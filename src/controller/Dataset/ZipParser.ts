import JSZip from "jszip";
import { InsightError, InsightDatasetKind } from "../IInsightFacade";
import { Dataset, Section, Room, Building } from "./Dataset";
import { JSZipObject } from "jszip";
// import { Section } from "./Section";
// import { Room, Building } from "./Room";
const parse5 = require("parse5");

export abstract class ZipParser {
	public async parseContent(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset> {
		const zip = await this.validateZip(content);
		const data = await this.getDataFromZip(zip);

		const dataset = new Dataset({
			id: id,
			kind: kind,
			numRows: data.length,
		});
		dataset.data = data;

		return dataset;
	}

	protected async validateZip(content: string): Promise<JSZip> {
		try {
			return await JSZip.loadAsync(content, { base64: true });
		} catch {
			throw new InsightError("Invalid ZIP");
		}
	}

	public abstract getDataFromZip(zip: JSZip): Promise<Section[] | Room[]>;
}

export class SectionParser extends ZipParser {
	public async getDataFromZip(zip: JSZip): Promise<Section[]> {
		const coursesFolder = await this.checkCoursesFolder(zip);

		const sections: Section[] = [];

		// Parse and validate course files
		await this.processFiles(coursesFolder.files, sections);

		return sections;
	}

	private async checkCoursesFolder(zip: JSZip): Promise<JSZip> {
		const files = zip.files;
		const hasCoursesFolder = Object.keys(files).some((key) => key.startsWith("courses/"));

		if (!hasCoursesFolder) {
			throw new InsightError("Dataset must contain a 'courses' folder");
		}
		const coursesFolder = zip.folder("courses");
		if (!coursesFolder) {
			throw new InsightError("coursesFolder null");
		}
		return coursesFolder;
	}

	private async processFiles(courseFiles: Record<string, JSZipObject>, sections: Section[]): Promise<void> {
		const allSections: any[] = [];

		const parsePromises = Object.keys(courseFiles).map(async (fileName) => {
			const file = courseFiles[fileName];
			const fileContent = await file.async("string");

			const parsedData = JSON.parse(fileContent);
			if (parsedData.result && Array.isArray(parsedData.result)) {
				allSections.push(...Object.values(parsedData.result));
			} else {
				throw new InsightError(`Invalid 'result' key in file: ${fileName}`);
			}
		});

		await Promise.allSettled(parsePromises);

		allSections.forEach((sectionData: any) => {
			if (this.isValidSection(sectionData)) {
				sections.push(new Section(sectionData));
			}
		});

		if (sections.length === 0) {
			throw new InsightError("No valid sections found in dataset");
		}
	}

	private isValidSection(section: any): boolean {
		const requiredFields = ["id", "course", "title", "professor", "subject", "year", "avg", "pass", "fail", "audit"];
		const sectionFields = Object.keys(section).map((field) => field.toLowerCase());
		// Check if all required fields are present in the section
		return requiredFields.every((field) => sectionFields.includes(field.toLowerCase()));
	}
}

export class RoomParser extends ZipParser {
	public async getDataFromZip(zip: JSZip): Promise<Section[] | Room[]> {
		// Check if index.htm exists
		const indexFile = zip.file("index.htm");
		if (!indexFile) {
			throw new InsightError("index.htm not found");
		}

		// parse index.htm
		const indexPromise = await indexFile.async("text");
		const parsedDoc = parse5.parse(indexPromise);
		// console.log("log: " + parsedDoc);

		// find the valid building list table.
		const buildingTable = this.findBuildingTable(parsedDoc);
		if (!buildingTable) {
			throw new InsightError("No valid building table found");
		}

		const buildings = this.extractBuildingsData(buildingTable);
		if (!buildings || buildings.length === 0) {
			throw new InsightError("No buildings data found");
		}

		const roomPromises = buildings.map(async (building) => 
			this.processBuildingFile(building, zip));

		const roomsArray = await Promise.all(roomPromises);
		const rooms: Room[] = roomsArray.flat();

		// do geolocation to set lon, lat
		//

		return rooms;
	}

	private async processBuildingFile(building: Building, zip: JSZip): Promise<Room[]> {
		// Fetch the HTML content of the building's page
		let parsedBuildingDoc;
		try {
			parsedBuildingDoc = await this.fetchBuildingPage(building.link, zip);
		} catch {
			return [];
		}

		// Extract room table from the parsed document
		const roomTable = this.findRoomTable(parsedBuildingDoc);
		if (!roomTable) {
			return []; // no valid table for this building file, process next building
		}

		// Extract rooms data from the table
		const rooms = this.extractRoomData(roomTable, building);
		return rooms;
	}

	private async fetchBuildingPage(link: string, zip: JSZip): Promise<string> {
		// Remove the leading './' from buildingLink to get the correct path in the ZIP
		const buildingFilePath = link.replace("./", "");

		// Fetch the file from the zip
		const buildingFile = zip.file(buildingFilePath);
		if (!buildingFile) {
			throw new Error(`Building file not found in ZIP`);
		}

		// parse content of file
		const buildingContent = await buildingFile.async("text");
		return parse5.parse(buildingContent);
	}

	private findRoomTable(node: any): any {
		if (!node) return null;

		if (node.tagName === "table" && this.isRoomTable(node)) {
			return node;
		}
		if (node.childNodes) {
			for (const child of node.childNodes) {
				const resultNode = this.findRoomTable(child); // recurse on children
				if (resultNode) return resultNode; // Return the first valid result found
			}
		}
		return null;
	}

	private isRoomTable(table: any): boolean {
		return table.childNodes.some(
			(row: any) =>
				row.tagName === "tr" && // Ensure it's a row
				row.childNodes.some(
					(cell: any) =>
						cell.nodeName === "td" &&
						cell.classList?.includes("views-field-field-room-number") &&
						cell.classList?.includes("views-field-field-room-capacity") &&
						cell.classList?.includes("views-field-field-room-type") &&
						cell.classList?.includes("views-field-field-room-furniture") &&
						cell.classList?.includes("views-field-nothing")
				)
		);
	}

	private extractRoomData(table: any, building: Building): any[] {
		const roomData: Room[] = [];

		table.childNodes.forEach((childNode: any) => {
			if (childNode.nodeName === "tbody") {
				childNode.childNodes.forEach((row: any) => {
					if (row.nodeName === "tr") {
						const room = new Room();
						room.number = this.nodeSearch("views-field-field-room-number", row);
						room.seats = parseInt(this.nodeSearch("views-field-field-room-capacity", row));
						room.type = this.nodeSearch("views-field-field-room-type", row);
						room.furniture = this.nodeSearch("views-field-field-room-furniture", row);
						room.href = this.nodeSearch("views-field-nothing", row);
						room.fullname = building.fullname;
						room.shortname = building.shortname;
						room.address = building.address;
						room.name = room.shortname + "_" + room.number;
						room.lon = room.lat = 0; // for now

						roomData.push(room);
					}
				});
			}
		});
		return roomData;
	}

	private extractBuildingsData(buildingTable: any): Building[] {
		const buildings: Building[] = [];

		buildingTable.childNodes.forEach((childNode: any) => {
			if (childNode.nodeName === "tbody") {
				buildings.push(...this.extractBuildingDataFromRows(childNode.childNodes));
			}
		});

		return buildings;
	}

	private extractBuildingDataFromRows(rows: any[]): Building[] {
		return rows
			.filter((row: any) => row.nodeName === "tr")
			.map((row: any) => {
				const shortnameNode = row.childNodes.find((cell: any) =>
					cell.classList?.includes("views-field-field-building-code")
				);
				const fullnameNode = row.childNodes.find((cell: any) => cell.classList?.includes("views-field-title"));
				const addressNode = row.childNodes.find((cell: any) =>
					cell.classList?.includes("views-field-field-building-address")
				);
				const linkNode = row.childNodes.find(
					(cell: any) => cell.nodeName === "td" && cell.classList?.includes("views-field-title")
				);

				const shortname = shortnameNode ? shortnameNode.textContent : "";
				const fullname = fullnameNode ? fullnameNode.textContent : "";
				const address = addressNode ? addressNode.textContent : "";

				const link =
					linkNode && linkNode.childNodes[0]?.nodeName === "a"
						? linkNode.childNodes[0].attrs.find((attr: any) => attr.name === "href")?.value
						: "";

				// Ensure the link contains the desired prefix
				if (link.startsWith("./campus/discover/buildings-and-classrooms/")) {
					return new Building(shortname, fullname, address, link);
				}
				return null;
			})
			.filter((building: any): building is Building => building !== null); // remove nulls
	}

	private nodeSearch(className: string, row: any): string {
		const cell = row.childNodes.find((c: any) => c.classList?.includes(className));
	
		return cell?.childNodes.find((child: any) => child.nodeName === "#text" && child.value)
			?.value.trim() ?? "";
	}

	private findBuildingTable(node: any): any {
		if (!node) return null;

		if (node.tagName === "table" && this.isBuildingTable(node)) {
			return node;
		}
		if (node.childNodes) {
			for (const child of node.childNodes) {
				const resultNode = this.findBuildingTable(child); // recurse on children
				if (resultNode) return resultNode; // Return the first valid result found
			}
		}
		return null;
	}

	private isBuildingTable(table: any): boolean {
		// Iterate through rows in the table
		return table.childNodes.some(
			(row: any) =>
				row.tagName === "tr" && // Ensure it's a row
				row.childNodes.some((cell: any) => {
					return cell.nodeName === "td" && cell.classList?.includes("views-field");
				})
		);
	}

	private static isValidRoom(room: any): boolean {
		const requiredFields = [
			"fullname",
			"shortname",
			"number",
			"name",
			"address",
			"lat",
			"lon",
			"seats",
			"type",
			"furniture",
			"href",
		];
		const roomFields = Object.keys(room).map((field) => field.toLowerCase());
		// Check if all required fields are present in the section
		if (!requiredFields.every((field) => roomFields.includes(field.toLowerCase()))) {
			return false;
		}
		// check if requested room's geolocation request returns successfully (i.e., there is no error)
		// TODO
		return true;
	}
}
