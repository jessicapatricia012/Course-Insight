import { JSZipObject } from "jszip";
import JSZip from "jszip";
const parse5 = require("parse5");
import { InsightError, InsightDatasetKind, InsightDataset } from "./IInsightFacade";
import { Dataset } from "./Dataset";
import { Section } from "./Section";
import fs from "fs-extra";
import path from "path";

const DATA_DIR = "./data";

export class DatasetProcessor {
	/* returns true if id is validationPromises, 
    false otherwise (has underscore or whitespace only)*/
	public static validId(id: string): boolean {
		if (!id.trim() || id.includes("_")) {
			return false;
		}
		return true;
	}

	/* returns true if dataset with id <id> is in disk, 
    false otherwise */
	public static async isInDisk(id: string): Promise<boolean> {
		try {
			await fs.ensureDir(DATA_DIR);
			const datasetPath = path.join(DATA_DIR, `${id}.json`);
			await fs.access(datasetPath); // Check if the file exists
			return true;
		} catch {
			return false; // File doesn't exist
		}
	}

	private static isValidSection(section: any): boolean {
		const requiredFields = ["id", "course", "title", "professor", "subject", "year", "avg", "pass", "fail", "audit"];
		const sectionFields = Object.keys(section).map((field) => field.toLowerCase());
		// Check if all required fields are present in the section
		return requiredFields.every((field) => sectionFields.includes(field.toLowerCase()));
	}

	public static async parseSectionContent(id: string, content: string): Promise<Dataset> {
		let zip = null;
		try {
			zip = await JSZip.loadAsync(content, { base64: true });
		} catch {
			throw new InsightError("Invalid ZIP format");
		}
		// Validate courses folder and files
		const coursesFolder = await DatasetProcessor.checkCoursesFolder(zip);

		const sections: Section[] = [];

		// Parse and validate course files
		await DatasetProcessor.processFiles(coursesFolder.files, sections);

		// Create a new Dataset and assign the sections to it
		const dataset = new Dataset({
			id: id,
			kind: InsightDatasetKind.Sections,
			numRows: sections.length,
		});
		dataset.sections = sections;

		return dataset;
	}

	private static async checkCoursesFolder(zip: JSZip): Promise<JSZip> {
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

	private static async processFiles(courseFiles: Record<string, JSZipObject>, sections: Section[]): Promise<void> {
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

	public static async addToDisk(id: string, dataset: Dataset): Promise<void> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		await fs.writeJson(datasetPath, dataset);
	}

	public static async deleteFromDisk(id: string): Promise<void> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		await fs.remove(datasetPath);
	}

	public static async readFromDisk(): Promise<InsightDataset[]> {
		await fs.ensureDir(DATA_DIR);
		// Get all files in the /data directory
		const files = await fs.readdir(DATA_DIR);

		// Read each JSON file and extract the required data
		const datasets = await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(DATA_DIR, file);
				const fileContent = await fs.readJson(filePath);
				const { id, kind, numRows } = fileContent.insightDataset;

				return { id, kind, numRows };
			})
		);
		return datasets;
	}

	public static async getDatasetFromDiskWithId(id: string): Promise<Dataset> {
		await fs.ensureDir(DATA_DIR);
		const datasetPath = path.join(DATA_DIR, `${id}.json`);
		const content = await fs.readJson(datasetPath);
		const insightDataset: InsightDataset = content.insightDataset;
		const dataset = new Dataset(insightDataset);

		for (const section of content.sections) {
			dataset.sections.push(section);
		}

		return dataset;
	}

	public static async parseRoomContent(id: string, content: string): Promise<Dataset> {
		let zip = null;
		try {
			zip = await JSZip.loadAsync(content, { base64: true });
		} catch {
			throw new InsightError("Invalid ZIP format");
		}

		// Check if index.htm exists
		const indexFile = zip.file("index.htm"); 
		if (!indexFile) { 
			throw new InsightError("index.htm not found"); 
		}

		// parse index.htm
		const indexPromise = await indexFile.async("text");
		const parsedDoc = parse5.parse(indexPromise);
		console.log("log: " + parsedDoc);
	
		// find the valid building list table.
		const buildingTable = this.findBuildingTable(parsedDoc);
		if (!buildingTable) {
			throw new InsightError("No valid building table found");
		}

		const dataset = new Dataset({
			id: id,
			kind: InsightDatasetKind.Rooms,
			numRows: 1,
		});
		return dataset;

		// TODO
	}

	private static findBuildingTable(node: any): any {
		if (!node) return null;

		if (node.tagName === "table" && DatasetProcessor.isBuildingTable(node)) {
			return node;
		}
		if (node.childNodes) {
			for (const child of node.childNodes) {
				const resultNode = DatasetProcessor.findBuildingTable(child); // recurse on children
			if (resultNode) return resultNode; // Return the first valid result found
			}
		}
		return null;
	}

	private static isBuildingTable(table: any): boolean {
		return table.childNodes.some((row: any) => row.childNodes.some((cell: any) => {
			return cell.nodeName === 'td' && cell.classList?.includes('views-field-title')  && cell.classList?.includes('views-field-field-building-address');
		}));
	}
	

	private static isValidRoom(room: any): boolean {
		const requiredFields = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type", "furniture", "href"];
		const roomFields = Object.keys(room).map((field) => field.toLowerCase());
		// Check if all required fields are present in the section
		if (!requiredFields.every((field) => roomFields.includes(field.toLowerCase()))) {
			return false;
		}
		// check if requested room's geolocation request returns successfully (i.e., there is no error)
		// TODO
		return true
	}
}
