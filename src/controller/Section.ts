export class Section {
	public id: string;
	public course: string;
	public title: string;
	public professor: string;
	public subject: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(json: any) {
		this.id = json.id.toString();
		this.course = json.Course;
		this.title = json.Title;
		this.professor = json.Professor;
		this.subject = json.Subject;
		this.year = json.Year;
		this.avg = json.Avg;
		this.pass = json.Pass;
		this.fail = json.Fail;
		this.audit = json.Audit;
	}
}
