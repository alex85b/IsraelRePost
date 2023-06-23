// Defines the 'branch' as its received from the API requests: LoadBranches, GetBranch.
export interface IBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string | null;
	openstatus: number;
	displaystatus: number;
	branchtype: number;
	telephone: string;
	fax: string;
	manager: string;
	qnomycode: number;
	haszimuntor: number;
	qnomyWaitTimeCode: number;
	region: number;
	area: number;
	sector: number;
	city: string;
	cityEN: string | null;
	citycode: string;
	street: string;
	streetEN: string | null;
	streetcode: string | null;
	house: number;
	zip: string;
	addressdesc: string;
	addressdescEN: string | null;
	geocode_latitude: number;
	geocode_longitude: number;
	createdDate: string | null;
	closedDate: string | null;
	Services: { serviceid: number }[];
	ExtraServices: { extraserviceid: number }[];
	accessibility: { accessiblitytypeid: number; value: number }[];
	hours: {
		dayofweek: number;
		openhour1: string | null;
		closehour1: string | null;
		openhour2: string | null;
		closehour2: string | null;
	}[];
	temphours: {
		messageid: number;
		dayofweek: number;
		openhour1: string;
		closehour1: string;
		openhour2: string;
		closehour2: string;
		validdate: string;
		description: string | null;
	}[];
	messages: {
		id: number;
		title: string;
		text: string;
		validfromdate: string;
		validtodate: string;
		displayfromdate: string;
		displaytodate: string;
	}[];
	showProductInventories: boolean;
	isMakeAppointment: boolean;
	generalMessage: any;
}
