export class Section {
	public id: string;
	public uuid: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(json: any) {
		this.id = json.Course;
		this.uuid = json.id.toString();
		this.title = json.Title;
		this.instructor = json.Professor;
		this.dept = json.Subject;
		if (json.Section === "overall") {
			this.year = 1900;
		} else {
			this.year = json.Year;
		}
		this.avg = json.Avg;
		this.pass = json.Pass;
		this.fail = json.Fail;
		this.audit = json.Audit;
	}
}
