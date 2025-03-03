import JSZip from "jszip";
import { InsightError, InsightDatasetKind } from "../IInsightFacade";
import { Dataset, Section, Room, Building } from "./Dataset";
import { JSZipObject } from "jszip";
import { doGeolocation } from "./Georesponse";
const parse5 = require("parse5");

export abstract class ZipParser {
	public async parseContent(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset> {
		const zip = await this.validateZip(content); //
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
		const indexFile = zip.files["index.htm"];
		if (!indexFile) {
			throw new InsightError("index.htm not found");
		}

		// parse index.htm
		const indexPromise = await indexFile.async("text");
		const parsedDoc = parse5.parse(indexPromise); //

		// console.log(parsedDoc);

		// find the valid building list table.
		const buildingTable = this.findBuildingTable(parsedDoc);
		if (!buildingTable) {
			throw new InsightError("No valid building table found");
		}
		// console.log(buildingTable);

		let buildings = this.extractBuildingsData(buildingTable);

		buildings = await doGeolocation(buildings);

		const roomPromises = buildings.map(async (building) => this.processBuildingFile(building, zip));

		const roomsArray = await Promise.all(roomPromises);
		const rooms: Room[] = roomsArray.flat();
		// console.log(rooms);

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
		if (node.childNodes && node.childNodes.length > 0) {
			for (const child of node.childNodes) {
				const resultNode = this.findRoomTable(child); // recurse on children
				if (resultNode) return resultNode; // Return the first valid result found
			}
		}
		return null;
	}

	private isRoomTable(table: any): boolean {
		const requiredFields = [
			"views-field-field-room-number",
			"views-field-field-room-capacity",
			"views-field-field-room-type",
			"views-field-field-room-furniture",
			"views-field-nothing"
		];

		if (table.nodeName === "td" && table.attrs) {
			const attribute = table.attrs.find((attr: any) => attr.name === "class");
			if (attribute) {
				return requiredFields.some((field) => attribute.value.includes(field));
			}
		}
		if (table.childNodes) {
			return table.childNodes.some((child: any) => this.isRoomTable(child));
		}
		return false;
	}

	private extractRoomData(table: any, building: Building): any[] {
		const rooms: Room[] = [];

		table.childNodes.forEach((childNode: any) => {
			if (childNode.nodeName === "tbody") {
				childNode.childNodes.forEach((row: any) => {
					if (row.nodeName === "tr") {
						const room = new Room(building);
						const numberNode = this.findNodeByClass("views-field-field-room-number", row);
						const seatsNode = this.findNodeByClass("views-field-field-room-capacity", row);
						const typeNode = this.findNodeByClass("views-field-field-room-type", row);
						const furnitureNode = this.findNodeByClass("views-field-field-room-furniture", row);
						const hrefNode = this.findNodeByClass("views-field-nothing", row);
						room.number = this.getTextContent(numberNode);
						room.seats = parseInt(this.getTextContent(seatsNode));
						room.type = this.getTextContent(typeNode);
						room.furniture = this.getTextContent(furnitureNode);
						room.href = this.getTextContent(hrefNode);
						rooms.push(room);
					}
				});
			}
		});
		return rooms;
	}

	private extractBuildingsData(buildingTable: any): Building[] {
		const buildings: Building[] = [];

		buildingTable.childNodes.forEach((childNode: any) => {
			if (childNode.nodeName === "tbody") {
				buildings.push(...this.extractBuildingDataFromRows(childNode.childNodes));
			}
		});
		if (!buildings || buildings.length === 0) {
			throw new InsightError("No buildings data found");
		}
		return buildings;
	}

	private extractBuildingDataFromRows(rows: any[]): Building[] {
		return rows.filter((row: any) => 
			row.nodeName === "tr").map((row: any) => {
				const shortnameNode = this.findNodeByClass("views-field views-field-field-building-code", row)
				const fullnameNode = this.findNodeByClass("views-field-title", row);
				const addressNode = this.findNodeByClass("views-field-field-building-address", row);

				const link = this.extractLink(fullnameNode);
				// Ensure the link has the corect path
				if (link.startsWith("./campus/discover/buildings-and-classrooms/")) {
					return new Building(
						this.getTextContent(shortnameNode), 
						this.getTextContent(fullnameNode), 
						this.getTextContent(addressNode),
						link);
				}
				return null;
			})
			.filter((building: any): building is Building => building !== null); // remove nulls
	}

	private extractLink(linkNode: any): string {	
		const anchorNode = this.findNodeByTag(linkNode, "a");
		return anchorNode?.attrs?.find((attr: any) => attr.name === "href")?.value || "";
	}
	
	private findNodeByTag(node: any, tag: string): any {
		if (!node) return null;
    	for (const child of node.childNodes ?? []) {
			if (child.nodeName === tag) return child;
			const found = this.findNodeByTag(child, tag);
			if (found) return found;
		}
		return null;
	}

	private findNodeByClass(className: string, row: any): string {
		return row.childNodes.find((c: any) =>
			c.nodeName === "td" && c.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes(className))
		);
	}

	private getTextContent(node: any): string {
		if (node.nodeName === "#text") {
			return node.value ?? "";
		}
		return node.childNodes?.map((child: any) => this.getTextContent(child)).join(" ").trim() ?? "";
	}
	
	private findBuildingTable(node: any): any {
		if (!node) return null;

		if (node.tagName === "table" && this.isBuildingTable(node)) {
			return node;
		}
		if (node.childNodes && node.childNodes.length > 0) {
			for (const child of node.childNodes) {
				const resultNode = this.findBuildingTable(child); // recurse on children
				if (resultNode) return resultNode; // Return the first valid result found
			}
		}
		return null;
	}

	private isBuildingTable(table: any): boolean {
		const requiredFields = [
			"views-field-title",
			"views-field-field-building-address",
			"views-field-field-building-code"
		];

		if (table.nodeName === "td" && table.attrs) {
			const attribute = table.attrs.find((attr: any) => attr.name === "class");
			if (attribute) {
				return requiredFields.some((field) => attribute.value.includes(field));
			}
		}
		if (table.childNodes) {
			return table.childNodes.some((child: any) => this.isBuildingTable(child));
		}
		return false;
	}

	// private static isValidRoom(room: any): boolean {
	// 	const requiredFields = [
	// 		"fullname",
	// 		"shortname",
	// 		"number",
	// 		"name",
	// 		"address",
	// 		"lat",
	// 		"lon",
	// 		"seats",
	// 		"type",
	// 		"furniture",
	// 		"href",
	// 	];
	// 	const roomFields = Object.keys(room).map((field) => field.toLowerCase());
	// 	// Check if all required fields are present in the section
	// 	if (!requiredFields.every((field) => roomFields.includes(field.toLowerCase()))) {
	// 		return false;
	// 	}
	// 	// check if requested room's geolocation request returns successfully (i.e., there is no error)
	// 	// TODO
	// 	return true;
	// }
}
