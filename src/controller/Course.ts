import { Section } from "./Section";

export class Course {
	public sections: Section[];

	constructor(json: any) {
		this.sections = [];
		if (Array.isArray(json.result)) {
			for (const sectionData of json.result) {
				try {
					this.sections.push(new Section(sectionData));
				} catch {
					// Ignore invalid sections
				}
			}
		}
	}
}
