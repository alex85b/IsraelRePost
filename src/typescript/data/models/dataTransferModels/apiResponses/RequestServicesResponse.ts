import { AxiosResponse } from 'axios';
import { IPostofficeResponseData } from './shared/PostofficeResponseData';

export interface IServicesResponseData {
	serviceId: number;
	serviceName: string;
	serviceDescription: string;
	ServiceTypeId: number;
	serviceTypeDescription: string;
	description: string;
	showStats: boolean;
	waitingTime: number;
	HasCalendarService: boolean;
	DynamicFormsEnabled: boolean;
	HasFIFOService: boolean;
	ExtRef: string;
	LocationId: number;
}

export interface IExpectedServiceResponse extends IPostofficeResponseData {
	Results: IServicesResponseData[];
}

export interface IRequestServicesResponse {
	getServices(): IServicesResponseData[];
	toString(): string;
}

export class RequestServicesResponse implements IRequestServicesResponse {
	private services: IServicesResponseData[];

	private constructor(buildData: { postofficeBranchServices: IServicesResponseData[] }) {
		this.services = buildData.postofficeBranchServices;
	}

	getServices() {
		return [...this.services];
	}

	toString() {
		return this.services
			.map((service) => {
				return [
					`Service ID: ${service.serviceId}`,
					`Service Name: ${service.serviceName}`,
					`Service Description: ${service.serviceDescription}`,
					`Service Type ID: ${service.ServiceTypeId}`,
					`Service Type Description: ${service.serviceTypeDescription}`,
					`Description: ${service.description}`,
					`Show Stats: ${service.showStats}`,
					`Waiting Time: ${service.waitingTime}`,
					`Has Calendar Service: ${service.HasCalendarService}`,
					`Dynamic Forms Enabled: ${service.DynamicFormsEnabled}`,
					`Has FIFO Service: ${service.HasFIFOService}`,
					`Ext Ref: ${service.ExtRef}`,
					`Location ID: ${service.LocationId}`,
				].join('\n');
			})
			.join('\n\n');
	}

	static Builder = class {
		private services: IServicesResponseData[] = [];

		useAxiosResponse(
			rawResponse: Omit<AxiosResponse<IExpectedServiceResponse, any>, 'request' | 'config'>
		) {
			const faults: string[] = [];
			const success = rawResponse.data?.Success ?? false;
			const services = rawResponse.data?.Results;

			if (typeof success !== 'boolean' || (typeof success === 'boolean' && !success)) {
				faults.push('services response status is failed');
			}
			if (!Array.isArray(services)) {
				faults.push('services array is malformed or does not exist');
			} else if (!services.length) {
				faults.push('response contains no services');
			}
			if (faults.length) throw Error(faults.join(' | '));

			const demoService = services[0];
			const serviceId = demoService.serviceId;

			if (typeof serviceId !== 'number') throw Error('service id is invalid');

			this.services = services;
			return this;
		}

		build() {
			return new RequestServicesResponse({ postofficeBranchServices: this.services });
		}
	};
}
