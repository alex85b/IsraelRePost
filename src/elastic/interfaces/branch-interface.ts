// Define a single branch interface.
export interface IBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
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
	cityEN: string;
	citycode: string;
	street: string;
	streetEN: string;
	streetcode: string;
	house: number;
	zip: string;
	addressdesc: string;
	addressdescEN: string;
	geocode_latitude: number;
	geocode_longitude: number;
	location: {
		lat: number;
		lon: number;
	};
	createdDate: Date;
	closedDate: Date;
	Services: {
		serviceid: number;
	}[];
	ExtraServices: {
		extraserviceid: number;
	}[];
	accessibility: {
		accessiblitytypeid: number;
		value: number;
	}[];
	hours: {
		dayofweek: number;
		openhour1: string;
		closehour1: string;
		openhour2: string;
		closehour2: string;
	}[];
	temphours: {
		messageid: number;
		dayofweek: number;
		openhour1: string;
		closehour1: string;
		openhour2: string;
		closehour2: string;
		validdate: Date;
		description: string;
	}[];
	messages: {
		id: number;
		title: string;
		text: string;
		validfromdate: Date;
		validtodate: Date;
		displayfromdate: Date;
		displaytodate: Date;
	}[];
	showProductInventories: boolean;
	isMakeAppointment: boolean;
	generalMessage: string;
}
