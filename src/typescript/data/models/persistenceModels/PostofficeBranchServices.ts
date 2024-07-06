import {
	INewDateEntryRecord,
	INewServiceRecord,
} from '../../../api/elastic/branchServices/BranchServicesIndexing';
import { isValidISO8601DateTime, isValidString } from '../shared/FieldValidation';

// ############################################################################################
// ### Interfaces #############################################################################
// ############################################################################################

interface IService {
	serviceId: string;
	serviceName: string;
	dates: { [key: string]: INewDateEntryRecord };
}

export interface IPostofficeBranchServices {
	getServices(): INewServiceRecord[];
	getBranchId(): string;
	toString(): string;
}

export interface IPostofficeBranchServicesBuilder {
	addService(data: { serviceId: string; serviceName: string }): this;
	addDate(data: { serviceId: string; calendarId: string; calendarDate: string }): this;
	addHours(data: { serviceId: string; calendarId: string; hours: string[] }): this;
	build(branchId: string): IPostofficeBranchServices;
	safeBuild(branchId: string): {
		faults: string[];
		branchServices: IPostofficeBranchServices | undefined;
	};
}

// ############################################################################################
// ### Builder Class ##########################################################################
// ############################################################################################

export class PostofficeBranchServicesBuilder implements IPostofficeBranchServicesBuilder {
	private servicesDictionary: { [key: string]: IService } = {};
	private services: INewServiceRecord[] = [];
	private branchId = '-1';
	private faults: string[] = [];

	/*
    Inner Nested Class that implements 'IPostofficeBranchServices'*/
	private PostofficeBranchServices = class implements IPostofficeBranchServices {
		private services: INewServiceRecord[];
		private branchId;

		constructor(buildData: { branchServices: INewServiceRecord[]; branchId: string }) {
			this.services = buildData.branchServices;
			this.branchId = buildData.branchId;
		}

		getServices() {
			return [...this.services];
		}

		getBranchId() {
			return this.branchId;
		}

		toString() {
			return JSON.stringify(this.services, null, 3);
		}
	};

	addService(data: { serviceId: string; serviceName: string }) {
		const vServiceId = isValidString(data.serviceId);
		const vServiceName = isValidString(data.serviceName);
		if (vServiceId && vServiceName) {
			this.servicesDictionary[data.serviceId] = { ...data, dates: {} };
			return this;
		}
		console.log(
			'[addService] invalid service : ',
			JSON.stringify(this.servicesDictionary, null, 3)
		);
		if (!vServiceId) this.faults.push(`Invalid serviceId`);
		if (!vServiceName) this.faults.push(`Invalid serviceName`);
		return this;
	}

	addDate(data: { serviceId: string; calendarId: string; calendarDate: string }) {
		const service = this.servicesDictionary[data.serviceId];
		if (!service) {
			console.log(
				'[PostofficeBranchServices][addDate] data : ',
				JSON.stringify(this.PostofficeBranchServices, null, 4)
			);

			this.faults.push(`cannot add dates to : ${data.serviceId}`);
			return this;
		}
		const vCalendarId = isValidString(data.calendarId);
		const vCalendarDate = isValidISO8601DateTime(data.calendarDate);
		// const vCalendarDate = isValidString(data.calendarDate);
		if (vCalendarId && vCalendarDate) {
			this.servicesDictionary[data.serviceId].dates[data.calendarId] = {
				calendarId: data.calendarId,
				calendarDate: data.calendarDate,
				hours: [],
			};
			return this;
		}
		console.log(
			'[addService] invalid date : ',
			JSON.stringify(this.servicesDictionary, null, 3)
		);
		if (!vCalendarId) this.faults.push(`Invalid calendarId`);
		if (!vCalendarDate) this.faults.push(`Invalid calendarDate`);
		return this;
	}

	addHours(data: { serviceId: string; calendarId: string; hours: string[] }) {
		const date = this.servicesDictionary[data.serviceId]?.dates[data.calendarId];
		if (!date) {
			this.faults.push(`cannot add hours to : ${data.serviceId}.${data.calendarId}`);
			return this;
		}
		if (!Array.isArray(data.hours)) {
			this.faults.push(`appointment hours are not array ${typeof data.hours}`);
			return this;
		} else {
			const invalidHour = data.hours.find((hour) => !/^\d+$/.test(hour));
			if (invalidHour) {
				this.faults.push(`hours array contains non numerical value: ${invalidHour}`);
				return this;
			}
		}

		date.hours = data.hours;
		return this;
	}

	private convertToBranchServicesRecord() {
		return Object.keys(this.servicesDictionary).map((sId) => {
			const tempIService = this.servicesDictionary[sId];
			const newService: INewServiceRecord = {
				serviceId: tempIService.serviceId,
				serviceName: tempIService.serviceName,
				dates: Object.keys(tempIService.dates).map((dId) => tempIService.dates[dId]),
			};
			return newService;
		});
	}

	build(branchId: string): IPostofficeBranchServices {
		try {
			this.branchId = branchId;
			if (!isValidString(branchId)) this.faults.push('branchId is invalid string');
			if (this.faults.length)
				throw Error(
					`[PostofficeBranchRecord] Branch-${branchId} Errors : ` +
						JSON.stringify(this.servicesDictionary, null, 3) +
						' ' +
						this.faults.join(' | ')
				);
			const branchServices: INewServiceRecord[] = this.convertToBranchServicesRecord();
			return new this.PostofficeBranchServices({ branchServices, branchId });
		} finally {
			this.faults = [];
			this.servicesDictionary = {};
			this.services = [];
			this.branchId = '-1';
		}
	}

	safeBuild(branchId: string): {
		faults: string[];
		branchServices: IPostofficeBranchServices | undefined;
	} {
		try {
			if (!isValidString(branchId)) this.faults.push('branchId is invalid string');
			const branchServices: INewServiceRecord[] = this.convertToBranchServicesRecord();
			return {
				faults: this.faults,
				branchServices: this.faults.length
					? undefined
					: new this.PostofficeBranchServices({ branchServices, branchId }),
			};
		} finally {
			this.faults = [];
			this.servicesDictionary = {};
			this.services = [];
			this.branchId = '-1';
		}
	}
}

// ############################################################################################
// ### Wrappers of the Builder-class : PostofficeBranchServicesBuilder ########################
// ############################################################################################

/*
Response definition*/
export interface ISafeBranchServices {
	faults: string[];
	branchServices: IPostofficeBranchServices | undefined;
}

/*
Function definition*/
export interface IBranchServicesFromRecords {
	(buildData: { branchServices: INewServiceRecord[]; branchId: string }): ISafeBranchServices;
}

export const branchServicesFromRecords: IBranchServicesFromRecords = (buildData: {
	branchServices: INewServiceRecord[];
	branchId: string;
}): ISafeBranchServices => {
	const builder = new PostofficeBranchServicesBuilder();

	buildData.branchServices.forEach((serviceRecord) => {
		builder.addService({
			serviceId: serviceRecord.serviceId,
			serviceName: serviceRecord.serviceName,
		});

		serviceRecord.dates.forEach((dateRecord) => {
			builder
				.addDate({
					serviceId: serviceRecord.serviceId,
					calendarDate: dateRecord.calendarDate,
					calendarId: dateRecord.calendarId,
				})
				.addHours({
					serviceId: serviceRecord.serviceId,
					calendarId: dateRecord.calendarId,
					hours: dateRecord.hours,
				});
		});
	});

	return builder.safeBuild(buildData.branchId);
};
