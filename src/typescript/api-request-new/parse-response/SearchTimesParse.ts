import { BadApiResponse } from '../../errors/BadApiResponse';
import { IRequestResult, IResponse } from '../GenerateResponse';

export interface ISearchTimesResult extends IRequestResult {
	Results: {
		Time: number;
	}[];
}

export interface IParseTimesResponse {
	Results: IParseTimeResponse[];
}

export interface IParseTimeResponse {
	Time: number;
}

export const parseSearchTimesResponse = (
	responseObject: IResponse<ISearchTimesResult>
): IParseTimesResponse => {
	const { data, status } = responseObject;
	if (status !== 200)
		throw new BadApiResponse({
			message: `request failed ${status}`,
			source: 'parseSearchTimesResponse',
			data: { wholeResponse: responseObject },
		});

	const results = data.Results;
	if (!results) return { Results: [] }; // <-- Data may be null.
	if (!Array.isArray(results))
		// Data may not be ![] and !null
		throw new BadApiResponse({
			message: 'Result is not an array',
			source: 'parseSearchTimesResponse',
			data: {
				Results: results,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});

	// Check important keys existence.
	if (results.length > 0) {
		const time = results[0].Time;

		if (!time)
			throw new BadApiResponse({
				message: 'time keys missing',
				source: 'parseSearchTimesResponse',
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
