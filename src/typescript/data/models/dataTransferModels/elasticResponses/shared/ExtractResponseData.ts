import { AxiosResponse } from 'axios';

export const extractResponseData = <T>(
	elasticClientResponse: Omit<AxiosResponse<T, any>, 'request' | 'config'>
) => {
	const { data, headers, status, statusText } = elasticClientResponse;
	const faults: string[] = [];
	if (status !== 200) {
		faults.push(`response status indicates failure ${status ?? 'No-status'}`);
		faults.push(`response status text: ${statusText ?? 'No-status-text'}`);
	}
	if (typeof data === 'undefined' || data === null) {
		faults.push('response contains no data');
	}

	if (faults.length)
		throw Error(
			'[extractResponseData] faults : ' +
				faults.join(' | ') +
				JSON.stringify(elasticClientResponse, null, 3)
		);

	return data as T;
};
