// Defines the 'Branch' that exists in Elastic's database.

export interface INewServiceRecord {
	serviceId: string;
	serviceName: string;
	dates: INewDateEntryRecord[];
}

export interface INewDateEntryRecord {
	calendarId: string;
	calendarDate: string;
	hours: string[];
}

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
	services: INewServiceRecord[];
}
