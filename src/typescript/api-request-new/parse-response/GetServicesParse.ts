import { BadApiResponse } from '../../errors/BadApiResponse';
import { IRequestResult, IResponse } from '../GenerateResponse';

export interface IGetServicesResult extends IRequestResult {
	Results: {
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
	}[];
}

export const parseGetServicesResponse = (
	responseObject: IResponse<IGetServicesResult>
) => {
	const { data } = responseObject;
	const results = data.Results;

	if (!results) return { Results: [] }; // <-- Data may be null.
	if (!Array.isArray(results))
		// Data may not be ![] and !null
		throw new BadApiResponse({
			message: 'Result is not an array',
			source: 'parseGetServicesResponse',
			data: {
				Results: results,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});

	// Check important keys existence.
	const serviceId = results[0].serviceId;
	const serviceName = results[0].serviceName;
	const ServiceTypeId = results[0].ServiceTypeId;
	const LocationId = results[0].LocationId;

	if (!serviceId || !serviceName || !ServiceTypeId || !LocationId)
		throw new BadApiResponse({
			message: 'One or more important keys missing',
			source: 'parseGetServicesResponse',
			data: {
				Results: results,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});

	return {
		Results: results,
	};
};
