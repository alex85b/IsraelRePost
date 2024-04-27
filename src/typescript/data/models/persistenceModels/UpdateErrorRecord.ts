import {
	IDateError,
	IErrorMapping,
	IServiceError,
} from '../../../api/elastic/updateErrors/UpdateErrorsIndexing';
import { ISingleErrorQueryResponse } from '../../elastic/ErrorIndexService';
import { isValidNumber, isValidString, validateAndAssign } from './shared/FieldValidation';

// ############################################################################################
// ### Interfaces #############################################################################
// ############################################################################################

export interface IPostofficeUpdateErrorBuilder {
	addUserError(data: { userError: string }): this;
	addServiceError(data: { serviceId: string; serviceError: string }): this;
	addDateError(data: { serviceId: string; calendarId: string; datesError: string }): this;
	addTimesError(data: { serviceId: string; calendarId: string; timesError: string }): this;
	build(branchId: string): IPostofficeUpdateError;
}

export interface IPostofficeUpdateError {
	getErrorDocument(): IErrorMapping;
	getBranchId(): string;
	toString(): string;
}

interface IUpdateErrorService {
	serviceId: string;
	serviceError: string;
	dates: { [key: string]: IDateError };
}

interface IUpdateErrorObject {
	userError: string;
	services: { [key: string]: IUpdateErrorService };
}

// ############################################################################################
// ### Builder Class ##########################################################################
// ############################################################################################

export class PostofficeUpdateErrorBuilder implements IPostofficeUpdateErrorBuilder {
	/*
	Nested inner class that encapsulates Update-error record*/
	private PostofficeUpdateError = class implements IPostofficeUpdateError {
		private updateErrorDocument: IErrorMapping;
		private branchId: string;

		constructor(buildData: { updateErrorDocument: IErrorMapping; branchId: string }) {
			this.branchId = buildData.branchId;
			this.updateErrorDocument = buildData.updateErrorDocument;
		}

		getErrorDocument() {
			return JSON.parse(JSON.stringify(this.updateErrorDocument)) as IErrorMapping;
		}

		getBranchId() {
			return this.branchId;
		}

		toString() {
			return (
				`Branch ID:${this.branchId} ` + JSON.stringify(this.updateErrorDocument, null, 3)
			);
		}
	};

	private updateErrorObject: IUpdateErrorObject;
	private faults: string[];

	constructor() {
		this.updateErrorObject = {
			userError: '',
			services: {},
		};
		this.faults = [];
	}

	addUserError(data: { userError: string }) {
		validateAndAssign({
			value: data.userError,
			validatorFunction: isValidString,
			assignTarget: this.updateErrorObject,
			assignKey: 'userError',
			faults: this.faults,
			errorMessage: 'userError string is invalid',
		});
		return this;
	}

	addServiceError(data: { serviceId: string; serviceError: string }) {
		const vServiceId = isValidString(data.serviceId);
		const vServiceError = isValidString(data.serviceError);
		if (vServiceError && vServiceId) {
			this.updateErrorObject.services[data.serviceId] = { ...data, dates: {} };
			return this;
		}
		console.log(
			'[addService] invalid service : ',
			JSON.stringify(this.updateErrorObject, null, 3)
		);
		if (!vServiceId) this.faults.push(`Invalid serviceId`);
		if (!vServiceError) this.faults.push(`Invalid serviceError`);
		return this;
	}

	addDateError(data: { serviceId: string; calendarId: string; datesError: string }) {
		const vServiceId = isValidString(data.serviceId);
		if (!vServiceId) {
			this.faults.push(`invalid serviceId`);
			return this;
		}
		const service = this.updateErrorObject.services[data.serviceId];
		if (!service) {
			this.faults.push(`cannot add date-error to : ${data.serviceId}`);
			return this;
		}
		const vCalendarId = isValidString(data.calendarId);
		const vDatesError = isValidString(data.datesError);
		if (vCalendarId && vDatesError) {
			service.dates[data.calendarId] = {
				calendarId: data.calendarId,
				datesError: data.datesError,
				timesError: '',
			};
			return this;
		}
		console.log(
			'[addService] invalid date-error : ',
			JSON.stringify(this.updateErrorObject, null, 3)
		);
		if (!vCalendarId) this.faults.push(`Invalid calendarId`);
		if (!vDatesError) this.faults.push(`Invalid datesError`);
		return this;
	}

	addTimesError(data: { serviceId: string; calendarId: string; timesError: string }) {
		const vServiceId = isValidString(data.serviceId);
		const vCalendarId = isValidString(data.serviceId);
		if (!vServiceId) {
			this.faults.push(`invalid serviceId`);
			return this;
		}
		if (!vCalendarId) {
			this.faults.push(`invalid calendarId`);
			return this;
		}
		const date = this.updateErrorObject?.services[data.serviceId]?.dates[data.calendarId];
		if (!date) {
			this.faults.push(`cannot add time-error to : ${data.serviceId}.${data.calendarId}`);
			return this;
		}
		if (isValidString(data.timesError)) date.timesError = data.timesError;
		else {
			console.log(
				'[addService] invalid date-error : ',
				JSON.stringify(this.updateErrorObject, null, 3)
			);
			this.faults.push(`invalid calendarId`);
		}
		return this;
	}

	private convertToIErrorMapping() {
		const errorRecord: IErrorMapping = {
			userError: this.updateErrorObject.userError,
			services: [],
		};
		errorRecord.services = Object.keys(this.updateErrorObject.services).map((sId) => {
			const tempIService = this.updateErrorObject.services[sId];
			const newService: IServiceError = {
				serviceId: tempIService.serviceId,
				serviceError: tempIService.serviceError,
				dates: Object.keys(tempIService.dates).map((dId) => tempIService.dates[dId]),
			};
			return newService;
		});
		return errorRecord;
	}

	build(branchId: string) {
		if (!isValidString(branchId)) this.faults.push(`invalid branchId`);
		if (this.faults.length)
			throw Error(
				`[UpdateErrorRecord] ErrorRecord-${branchId ?? 'Faulty ID'} Faults : ` +
					JSON.stringify(this.updateErrorObject, null, 3) +
					' ' +
					this.faults.join(' | ')
			);
		const errorRecord: IErrorMapping = this.convertToIErrorMapping();
		return new this.PostofficeUpdateError({
			branchId: branchId,
			updateErrorDocument: errorRecord,
		});
	}
}

// ############################################################################################
// ### Wrappers of the Builder-class : PostofficeUpdateErrorBuilder ###########################
// ############################################################################################

export const useSingleErrorQueryResponse = (data: {
	rawQueryResponse: ISingleErrorQueryResponse;
}) => {
	const source = data?.rawQueryResponse?._source;
	const builder: IPostofficeUpdateErrorBuilder = new PostofficeUpdateErrorBuilder();
	builder.addUserError({ userError: source?.userError });
	if (Array.isArray(source.services) && source.services.length) {
		source.services.forEach((service) => {
			builder.addServiceError({
				serviceId: service.serviceId,
				serviceError: service.serviceError,
			});

			if (Array.isArray(service.dates) && service.dates.length) {
				service.dates.forEach((date) => {
					builder.addDateError({
						serviceId: service.serviceId,
						calendarId: date.calendarId,
						datesError: date.datesError,
					});
					builder.addTimesError({
						serviceId: service.serviceId,
						calendarId: date.calendarId,
						timesError: date.timesError,
					});
				});
			}
		});
	}
	return builder;
};
