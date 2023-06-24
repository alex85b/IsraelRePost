// Defines the 'Branch' that exists in Elastic's database.
export interface IDocumentBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
	city: string;
	cityEN: string;
	street: string;
	streetEN: string;
	streetcode: string;
	zip: string;
	qnomycode: number;
	qnomyWaitTimeCode: number;
	haszimuntor: number;
	isMakeAppointment: number;
	location: {
		lat: number;
		lon: number;
	};
}
