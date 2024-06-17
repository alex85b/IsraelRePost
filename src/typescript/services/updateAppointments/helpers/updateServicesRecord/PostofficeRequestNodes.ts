import { omit } from '../../../../api/elastic/base/ElasticsearchUtils';
import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { IPostofficeRequestAxiosConfig } from '../../../../api/postOfficeCalls/base/PostofficeRequestConfig';
import { buildUserCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/CreateUserConfig';
import { buildDatesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchDatesConfig';
import { buildServicesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchServicesConfig';
import { buildTimesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchTimesConfig';
import {
	IExpectedDatesResponse,
	IRequestDatesResponse,
	RequestDatesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestDatesResponse';
import {
	IExpectedServiceResponse,
	IRequestServicesResponse,
	RequestServicesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestServicesResponse';
import {
	IExpectedTimesResponse,
	IRequestTimesResponse,
	RequestTimesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestTimesResponse';
import {
	IExpectedUserResponse,
	IRequestUserResponse,
	RequestUserResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestUserResponse';
import { IPostofficeBranchServicesBuilder } from '../../../../data/models/persistenceModels/PostofficeBranchServices';
import { IPostofficeUpdateErrorBuilder } from '../../../../data/models/persistenceModels/UpdateErrorRecord';

/*
This Module will be a demo of using nodes encapsulate a multilevel "get services" process.
All this code will be refactored to different locations \ Modules later.*/
// ######################################################################

// A Definition of a request node.
export interface IPostofficeRequestNode {
	performRequest(): Promise<IPostofficeRequestNode[]>;
}

/*
Implementations of a IPostofficeRequestNode*/
// #########################################
// #########################################

/*
Create-user Node, Performs a Create-user API request, returns Fetch-service Node*/
// ##############################################################################
// ##############################################################################
export class CreateUserNode implements IPostofficeRequestNode {
	private servicesModelBuilder: IPostofficeBranchServicesBuilder;
	private errorModelBuilder: IPostofficeUpdateErrorBuilder;
	private requestUserResponse: IRequestUserResponse | undefined;
	private qnomyCodeLocationId: string;
	private endpointProxyString: string | undefined;

	constructor(buildData: {
		servicesModelBuilder: IPostofficeBranchServicesBuilder;
		errorModelBuilder: IPostofficeUpdateErrorBuilder;
		qnomyCodeLocationId: string;
		endpointProxyString?: string;
	}) {
		this.errorModelBuilder = buildData.errorModelBuilder;
		this.servicesModelBuilder = buildData.servicesModelBuilder;
		this.qnomyCodeLocationId = buildData.qnomyCodeLocationId;
		this.endpointProxyString = buildData.endpointProxyString;
	}

	toString(): string {
		const { ARRAffinity, ARRAffinitySameSite, GCLB, CentralJWTCookie } =
			this.requestUserResponse?.getCookies() ?? {};
		const token = this.requestUserResponse?.getToken() ?? '';
		return `\nARRAffinity : ${ARRAffinity ?? ''}
		\nARRAffinitySameSite : ${ARRAffinitySameSite ?? ''}
		\nGCLB : ${GCLB ?? ''}
		\nCentralJWTCookie : ${CentralJWTCookie ?? ''}
		\nToken : ${token ?? ''}`;
	}

	async performRequest(): Promise<IPostofficeRequestNode[]> {
		const axiosConfig: IPostofficeRequestAxiosConfig = buildUserCallConfig(
			this.endpointProxyString
		);
		try {
			const rawResponse = await postofficeApiCall<IExpectedUserResponse>(axiosConfig);
			this.requestUserResponse = new RequestUserResponse.Builder()
				.useAxiosResponse(rawResponse)
				.build();
			return [
				new FetchServicesNode({
					errorModelBuilder: this.errorModelBuilder,
					servicesModelBuilder: this.servicesModelBuilder,
					requestUserResponse: this.requestUserResponse,
					qnomyCodeLocationId: this.qnomyCodeLocationId,
					endpointProxyString: this.endpointProxyString,
				}),
			];
		} catch (error) {
			const partialError = omit(error as Error, 'stack');
			this.errorModelBuilder.addUserError({ userError: JSON.stringify(partialError, null) });
			return [];
		}
	}
}

/*
Fetch-service Node, Performs a Fetch-service API request, returns array of Fetch-dates Nodes*/
// ##########################################################################################
// ##########################################################################################
export class FetchServicesNode implements IPostofficeRequestNode {
	private servicesModelBuilder: IPostofficeBranchServicesBuilder;
	private errorModelBuilder: IPostofficeUpdateErrorBuilder;
	private requestUserResponse: IRequestUserResponse;
	private qnomyCodeLocationId: string;
	private endpointProxyString: string | undefined;

	constructor(buildData: {
		servicesModelBuilder: IPostofficeBranchServicesBuilder;
		errorModelBuilder: IPostofficeUpdateErrorBuilder;
		requestUserResponse: IRequestUserResponse;
		qnomyCodeLocationId: string;
		endpointProxyString?: string;
	}) {
		this.errorModelBuilder = buildData.errorModelBuilder;
		this.servicesModelBuilder = buildData.servicesModelBuilder;
		this.requestUserResponse = buildData.requestUserResponse;
		this.qnomyCodeLocationId = buildData.qnomyCodeLocationId;
		this.endpointProxyString = buildData.endpointProxyString;
	}

	async performRequest(): Promise<IPostofficeRequestNode[]> {
		const axiosConfig: IPostofficeRequestAxiosConfig = buildServicesCallConfig({
			cookies: this.requestUserResponse.getCookies(),
			locationId: this.qnomyCodeLocationId,
			headerAuth: this.requestUserResponse.getToken(),
			endpointProxyString: this.endpointProxyString,
		});
		const datesRequestNodes: IPostofficeRequestNode[] = [];
		try {
			const rawResponse = await postofficeApiCall<IExpectedServiceResponse>(axiosConfig);
			const requestServicesResponse: IRequestServicesResponse =
				new RequestServicesResponse.Builder().useAxiosResponse(rawResponse).build();
			const servicesArray = requestServicesResponse.getServices();

			servicesArray.forEach((service) => {
				const { serviceId, serviceName } = service;
				this.servicesModelBuilder.addService({
					serviceId: serviceId.toString(),
					serviceName,
				});
				datesRequestNodes.push(
					new FetchDatesNode({
						serviceId: String(service.serviceId ?? ''),
						errorModelBuilder: this.errorModelBuilder,
						servicesModelBuilder: this.servicesModelBuilder,
						requestUserResponse: this.requestUserResponse,
						endpointProxyString: this.endpointProxyString,
					})
				);
			});
			return datesRequestNodes;
		} catch (error) {
			this.errorModelBuilder.addServiceError({
				serviceError: (error as Error).message,
			});
			return [];
		}
	}
}

/*
Fetch-dates Node, Performs a Fetch-dates API request, returns array of Fetch-times Nodes*/
// ######################################################################################
// ######################################################################################
export class FetchDatesNode implements IPostofficeRequestNode {
	private servicesModelBuilder: IPostofficeBranchServicesBuilder;
	private errorModelBuilder: IPostofficeUpdateErrorBuilder;
	private requestUserResponse: IRequestUserResponse;
	private serviceId: string;
	private endpointProxyString: string | undefined;

	constructor(buildData: {
		servicesModelBuilder: IPostofficeBranchServicesBuilder;
		errorModelBuilder: IPostofficeUpdateErrorBuilder;
		requestUserResponse: IRequestUserResponse;
		serviceId: string;
		endpointProxyString?: string;
	}) {
		this.errorModelBuilder = buildData.errorModelBuilder;
		this.servicesModelBuilder = buildData.servicesModelBuilder;
		this.requestUserResponse = buildData.requestUserResponse;
		this.serviceId = buildData.serviceId;
		this.endpointProxyString = buildData.endpointProxyString;
	}

	async performRequest(): Promise<IPostofficeRequestNode[]> {
		const axiosConfig: IPostofficeRequestAxiosConfig = buildDatesCallConfig({
			cookies: this.requestUserResponse.getCookies(),
			serviceId: this.serviceId,
			headerAuth: this.requestUserResponse.getToken(),
			endpointProxyString: this.endpointProxyString,
		});
		const timesRequestNodes: IPostofficeRequestNode[] = [];
		try {
			const rawResponse = await postofficeApiCall<IExpectedDatesResponse>(axiosConfig);
			const requestDatesResponse: IRequestDatesResponse = new RequestDatesResponse.Builder()
				.useAxiosResponse(rawResponse)
				.build();
			const datesArray = requestDatesResponse.getDates();
			datesArray.forEach((date) => {
				const { calendarDate, calendarId } = date;
				this.servicesModelBuilder.addDate({
					serviceId: this.serviceId,
					calendarDate,
					calendarId: String(calendarId),
				});
				timesRequestNodes.push(
					new FetchTimesNode({
						serviceId: String(this.serviceId ?? ''),
						errorModelBuilder: this.errorModelBuilder,
						servicesModelBuilder: this.servicesModelBuilder,
						requestUserResponse: this.requestUserResponse,
						calendarId: String(calendarId),
						endpointProxyString: this.endpointProxyString,
					})
				);
			});
			return timesRequestNodes;
		} catch (error) {
			this.errorModelBuilder.addDateError({
				serviceId: this.serviceId,
				datesError: (error as Error).message,
			});
			return [];
		}
	}
}

/*
Fetch-dates Node, Performs a Fetch-dates API request, returns array of Fetch-times Nodes*/
// ######################################################################################
// ######################################################################################
export class FetchTimesNode implements IPostofficeRequestNode {
	private servicesModelBuilder: IPostofficeBranchServicesBuilder;
	private errorModelBuilder: IPostofficeUpdateErrorBuilder;
	private requestUserResponse: IRequestUserResponse;
	private serviceId: string;
	private calendarId: string;
	private endpointProxyString: string | undefined;

	constructor(buildData: {
		servicesModelBuilder: IPostofficeBranchServicesBuilder;
		errorModelBuilder: IPostofficeUpdateErrorBuilder;
		requestUserResponse: IRequestUserResponse;
		serviceId: string;
		calendarId: string;
		endpointProxyString?: string;
	}) {
		this.errorModelBuilder = buildData.errorModelBuilder;
		this.servicesModelBuilder = buildData.servicesModelBuilder;
		this.requestUserResponse = buildData.requestUserResponse;
		this.serviceId = buildData.serviceId;
		this.calendarId = buildData.calendarId;
		this.endpointProxyString = buildData.endpointProxyString;
	}

	async performRequest(): Promise<IPostofficeRequestNode[]> {
		const axiosConfig: IPostofficeRequestAxiosConfig = buildTimesCallConfig({
			cookies: this.requestUserResponse.getCookies(),
			ServiceId: this.serviceId,
			headerAuth: this.requestUserResponse.getToken(),
			CalendarId: this.calendarId,
			endpointProxyString: this.endpointProxyString,
		});
		try {
			const rawResponse = await postofficeApiCall<IExpectedTimesResponse>(axiosConfig);
			const requestDatesResponse: IRequestTimesResponse = new RequestTimesResponse.Builder()
				.useAxiosResponse(rawResponse)
				.build();
			this.servicesModelBuilder.addHours({
				serviceId: this.serviceId,
				calendarId: this.calendarId,
				hours: requestDatesResponse.getTimes(),
			});
		} catch (error) {
			this.errorModelBuilder.addTimesError({
				serviceId: this.serviceId,
				calendarId: this.calendarId,
				timesError: (error as Error).message,
			});
		}
		return Promise.resolve([]);
	}
}
