import { BadApiResponse } from '../../errors/BadApiResponse';
import { IRequestResult } from '../GenerateResponse';

export interface ISearchDatesResult extends IRequestResult {
	Results: {
		calendarDate: string;
		calendarId: number;
	}[];
}

export interface IParseDatesResponse {
	Results: IParseDateResponse[];
}

export interface IParseDateResponse {
	calendarDate: string;
	calendarId: number;
}

export const parseSearchDatesResponse = (
	responseObject: ISearchDatesResult
): IParseDatesResponse => {
	const { data, status } = responseObject;
	if (status !== 200)
		throw new BadApiResponse({
			message: `request failed ${status}`,
			source: 'parseSearchDatesResponse',
			data: { wholeResponse: responseObject },
		});

	const results = data.Results;
	if (!results)
		throw new BadApiResponse({
			message: 'Result is null / undefined',
			source: 'parseSearchDatesResponse',
			data: {
				Results: results,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});

	if (!Array.isArray(results))
		throw new BadApiResponse({
			message: 'Result is not an array',
			source: 'parseSearchDatesResponse',
			data: {
				Results: results,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});

	// Check important keys existence.
	if (results.length > 0) {
		const calendarDate = results[0].calendarDate;
		const calendarId = results[0].calendarId;

		if (!calendarDate || !calendarId)
			throw new BadApiResponse({
				message: 'One or more important keys missing',
				source: 'parseSearchDatesResponse',
				data: {
					Results: results,
					status: data.status,
					isSuccessful: data.Success,
					errorMessage: data.ErrorMessage,
				},
			});
	}

	return {
		Results: results,
	};
};
