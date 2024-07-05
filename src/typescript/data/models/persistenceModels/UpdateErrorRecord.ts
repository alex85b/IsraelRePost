import {
	IDateError,
	IErrorMapping,
	IServiceError,
	ISingleErrorQueryResponse,
} from "../../../api/elastic/updateErrors/UpdateErrorsIndexing";
import { isValidString, validateAndAssign } from "../shared/FieldValidation";

// ############################################################################################
// ### Interfaces #############################################################################
// ############################################################################################

export interface IPostofficeUpdateErrorBuilder {
	addUserError(data: { userError: string }): this;
	addServiceError(data: { serviceId?: string; serviceError: string }): this;
	addDateError(data: {
		serviceId: string;
		calendarId?: string;
		datesError: string;
	}): this;
	addTimesError(data: {
		serviceId: string;
		calendarId: string;
		timesError: string;
	}): this;
	build(branchId: string): IPostofficeUpdateError;
}

export interface IPostofficeUpdateError {
	getErrorDocument(): IErrorMapping;
	getBranchId(): string;
	getErrorsCount(): number;
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

export class PostofficeUpdateErrorBuilder
	implements IPostofficeUpdateErrorBuilder
{
	/*
	Nested inner class that encapsulates Update-error record*/
	private PostofficeUpdateError = class implements IPostofficeUpdateError {
		private updateErrorDocument: IErrorMapping;
		private branchId: string;
		private errorCounter: number;

		constructor(buildData: {
			updateErrorDocument: IErrorMapping;
			branchId: string;
			errorCounter: number;
		}) {
			this.branchId = buildData.branchId;
			this.updateErrorDocument = buildData.updateErrorDocument;
			this.errorCounter = buildData.errorCounter;
		}

		getErrorDocument(): IErrorMapping {
			return JSON.parse(
				JSON.stringify(this.updateErrorDocument)
			) as IErrorMapping;
		}

		getBranchId(): string {
			return this.branchId;
		}

		getErrorsCount(): number {
			return this.errorCounter;
		}

		toString(): string {
			return (
				`Branch ID:${this.branchId} ` +
				JSON.stringify(this.updateErrorDocument, null, 3)
			);
		}
	};

	private updateErrorObject: IUpdateErrorObject;
	private faults: string[];
	private errorCounter: number;

	// This is a demo.
	private demoErrorObject: IUpdateErrorObject = {
		userError: "",
		services: {
			key1: { serviceId: "key1", serviceError: "E1", dates: {} },
			key2: {
				serviceId: "key2",
				serviceError: "E2",
				dates: {
					DKey1: { calendarId: "Dkey1", datesError: "DE1", timesError: "" },
					DKey2: { calendarId: "Dkey2", datesError: "", timesError: "TE1" },
				},
			},
		},
	};

	constructor() {
		this.updateErrorObject = {
			userError: "",
			services: {},
		};
		this.faults = [];
		this.errorCounter = 0;
	}

	addUserError(data: { userError: string }) {
		this.errorCounter++;
		validateAndAssign({
			value: data.userError,
			validatorFunction: isValidString,
			assignTarget: this.updateErrorObject,
			assignKey: "userError",
			faults: this.faults,
			errorMessage: "userError string is invalid",
		});
		return this;
	}

	addServiceError(data: { serviceId?: string; serviceError: string }) {
		this.errorCounter++;
		let actualId = "place-holder";
		if (isValidString(data.serviceId)) actualId = data.serviceId!;
		const vServiceError = isValidString(data.serviceError);
		if (vServiceError) {
			this.updateErrorObject.services[actualId] = {
				serviceId: actualId,
				serviceError: data.serviceError,
				dates: {},
			};
			return this;
		}
		if (!vServiceError) this.faults.push(`Invalid serviceError`);
		return this;
	}

	addDateError(data: {
		serviceId: string;
		calendarId?: string;
		datesError: string;
	}) {
		this.errorCounter++;
		let actualDateId = "place-holder";
		if (isValidString(data.calendarId)) actualDateId = data.calendarId!;
		const vServiceId = isValidString(data.serviceId);
		const vDatesError = isValidString(data.datesError);
		if (vServiceId && vDatesError) {
			if (!this.updateErrorObject.services[data.serviceId]) {
				this.updateErrorObject.services[data.serviceId] = {
					serviceId: data.serviceId,
					serviceError: "",
					dates: {},
				};
			}
			if (
				!this.updateErrorObject.services[data.serviceId]?.dates[actualDateId]
			) {
				this.updateErrorObject.services[data.serviceId].dates[actualDateId] = {
					calendarId: actualDateId,
					datesError: data.datesError,
					timesError: "",
				};
				return this;
			}
			this.updateErrorObject.services[data.serviceId].dates[
				actualDateId
			].datesError = data.datesError;
			return this;
		}
		if (!vServiceId) this.faults.push(`invalid serviceId`);
		if (!vDatesError) this.faults.push(`Invalid datesError`);
		return this;
	}

	addTimesError(data: {
		serviceId: string;
		calendarId: string;
		timesError: string;
	}) {
		this.errorCounter++;
		const vServiceId = isValidString(data.serviceId);
		const vCalendarId = isValidString(data.calendarId);
		const vTimesError = isValidString(data.timesError);
		if (vServiceId && vCalendarId && vTimesError) {
			const service = this.updateErrorObject.services[data.serviceId];
			const date = service?.dates[data.calendarId];
			if (!service) {
				this.updateErrorObject.services[data.serviceId] = {
					serviceId: data.serviceId,
					serviceError: "",
					dates: {},
				};
			}
			if (!date) {
				this.updateErrorObject.services[data.serviceId].dates[data.calendarId] =
					{
						calendarId: data.calendarId,
						datesError: "",
						timesError: data.timesError,
					};
				return this;
			}
			this.updateErrorObject.services[data.serviceId].dates[
				data.calendarId
			].timesError = data.timesError;
			return this;
		}
		if (!vServiceId) this.faults.push(`invalid serviceId`);
		if (!vCalendarId) this.faults.push(`Invalid calendarId`);
		if (!vTimesError) this.faults.push(`Invalid timesError`);
		return this;
	}

	private convertToIErrorMapping() {
		const errorRecord: IErrorMapping = {
			userError: this.updateErrorObject.userError,
			services: [],
		};
		errorRecord.services = Object.keys(this.updateErrorObject.services).map(
			(sId) => {
				const tempIService = this.updateErrorObject.services[sId];
				const newService: IServiceError = {
					serviceId: tempIService.serviceId,
					serviceError: tempIService.serviceError,
					dates: Object.keys(tempIService.dates).map(
						(dId) => tempIService.dates[dId]
					),
				};
				return newService;
			}
		);
		return errorRecord;
	}

	build(branchId: string) {
		if (!isValidString(branchId)) this.faults.push(`invalid branchId`);
		if (this.faults.length)
			throw Error(
				`[UpdateErrorRecord] ErrorRecord-${branchId ?? "Faulty ID"} Faults : ` +
					JSON.stringify(this.updateErrorObject, null, 3) +
					" " +
					this.faults.join(" | ")
			);
		const errorRecord: IErrorMapping = this.convertToIErrorMapping();
		return new this.PostofficeUpdateError({
			branchId: branchId,
			updateErrorDocument: errorRecord,
			errorCounter: this.errorCounter,
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
	const builder: IPostofficeUpdateErrorBuilder =
		new PostofficeUpdateErrorBuilder();
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
