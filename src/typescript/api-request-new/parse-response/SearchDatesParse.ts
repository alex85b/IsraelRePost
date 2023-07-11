import { BadApiResponse } from '../../errors/BadApiResponse';
import { IRequestResult, IResponse } from '../GenerateResponse';

export interface ISearchDatesResult extends IRequestResult {
	Results: {
		calendarDate: string;
		calendarId: number;
	}[];
}

export const parseSearchDatesResponse = (
	responseObject: IResponse<ISearchDatesResult>
) => {
	const { data } = responseObject;
	const results = data.Results;

	if (!results) return { Results: [] }; // <-- Data may be null.
	if (!Array.isArray(results))
		// Data may not be ![] and !null
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

	return {
		Results: results,
	};
};