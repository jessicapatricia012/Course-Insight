import { JSZipObject } from "jszip";
import JSZip from "jszip";
import { InsightError, InsightDatasetKind } from "./IInsightFacade";
import { Dataset } from "./Dataset";
import { Section } from "./Section";
import fs from "fs-extra";
import path from "path";

export class DatasetProcessor {
	private readonly DATA_DIR = "./data";

	public validId(id: string): boolean {
		if (!id.trim() || id.includes("_")) {
			// empty or whitesoace
			return false;
		}
		return true;
	}

	public async isInDisk(id: string): Promise<boolean> {
		const datasetPath = path.join(this.DATA_DIR, `${id}.json`); // Assume datasets are saved as JSON
		try {
			await fs.access(datasetPath); // Check if the file exists
			return true;
		} catch {
			return false; // File doesn't exist
		}
	}

	public async validateDataset(content: string): Promise<void> {
		try {
			// Unzip the content (base64 string)
			const zip = await JSZip.loadAsync(Buffer.from(content, "base64"));

			// Check if "courses" folder exists
			const coursesFolder = zip.folder("courses");
			if (!coursesFolder) {
				throw new InsightError("Dataset must contain a 'courses' folder");
			}
			// Get the files in the 'courses' folder and check if there are any files
			const courseFiles = coursesFolder.files;
			if (Object.keys(courseFiles).length === 0) {
				throw new InsightError("No course files found in the 'courses' folder");
			}

			// Collect promises to validate the course files
			const validationPromises = Object.keys(courseFiles).map(async (fileName) => {
				const file = courseFiles[fileName];

				// Read the content of the file as a string
				const fileContent = await file.async("string");

				try {
					// Try to parse the content as JSON
					const parsedData = JSON.parse(fileContent);

					// Check if the file contains a 'result' array
					if (parsedData.result && Array.isArray(parsedData.result)) {
						return true; // Valid course found
					} else {
						throw new InsightError(`Course file must contain a 'result' array: ${fileName}`);
					}
				} catch {
					// If parsing fails, treat it as an invalid file
					throw new InsightError(`Invalid JSON format in course file: ${fileName}`);
				}
			});

			// Wait for all validation promises and check if at least one valid course exists
			const results = await Promise.all(validationPromises);
			if (!results.includes(true)) {
				throw new InsightError("No valid course files found in the 'courses' folder");
			}
		} catch {
			throw new InsightError("Invalid dataset content");
		}
	}

	private isValidSection(section: any): boolean {
		const requiredFields = ["id", "course", "title", "professor", "subject", "year", "avg", "pass", "fail", "audit"];
		const sectionFields = Object.keys(section).map((field) => field.toLowerCase());
		// Check if all required fields are present in the section
		return requiredFields.every((field) => sectionFields.includes(field.toLowerCase()));
	}

	public async parseContent(id: string, content: string): Promise<Dataset> {
		let zip = null;
		try {
			zip = await JSZip.loadAsync(content, { base64: true });
		} catch {
			throw new InsightError("Invalid ZIP format");
		}
		// Validate courses folder and files
		const coursesFolder = await this.checkCoursesFolder(zip);

		const sections: Section[] = [];

		// Parse and validate course files
		await this.processCourseFiles(coursesFolder.files, sections);

		// Create a new Dataset and assign the sections to it
		const dataset = new Dataset(id, InsightDatasetKind.Sections);
		dataset.sections = sections;
		dataset.numRows = sections.length;

		return dataset;
	}

	private async checkCoursesFolder(zip: JSZip): Promise<JSZip> {
		const files = zip.files;
		const hasCoursesFolder = Object.keys(files).some((key) => key.startsWith("courses/"));

		if (!hasCoursesFolder) {
			throw new InsightError("Dataset must contain a 'courses' folder");
		}
		const coursesFolder = zip.folder("courses");
		if (!coursesFolder) {
			throw new InsightError("Some error");
		}

		const courseFiles = coursesFolder.files;
		if (Object.keys(courseFiles).length === 0) {
			throw new InsightError("No course files found in the 'courses' folder");
		}

		return coursesFolder;
	}

	private async processCourseFiles(courseFiles: Record<string, JSZipObject>, sections: Section[]): Promise<void> {
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
			} else {
				//console.warn("Invalid section:", sectionData);
			}
		});

		if (sections.length === 0) {
			throw new InsightError("No valid sections found in dataset");
		}
	}

	public async addToDisk(id: string, dataset: Dataset): Promise<string[]> {
		const datasetPath = path.join(this.DATA_DIR, `${id}.json`);
		try {
			await fs.ensureDir(this.DATA_DIR);
			await fs.writeJson(datasetPath, dataset);
			return [id]; // Or return any relevant data if needed
		} catch (error) {
			// Handle any errors that might occur during file system operations
			throw new InsightError("Failed to save dataset to disk: " + error);
		}
	}
}
