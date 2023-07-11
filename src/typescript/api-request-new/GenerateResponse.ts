import axios, {
	AxiosError,
	AxiosInstance,
	AxiosResponse,
	AxiosResponseHeaders,
} from 'axios';
import { BaseBuildRequestConfig } from './BaseBuildRequestConfig';

export interface IRequestResult extends AxiosResponse {
	Success: boolean;
	Results: { [key: string]: any }[] | { [key: string]: any } | null;
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: string | null;
	ErrorNumber: number;
	Messages: { [key: string]: any }[] | null;
}

export interface IResponse<K extends IRequestResult> {
	data: K;
	headers: AxiosResponseHeaders;
	status: number;
}

export type ResponseGenerator = <
	T extends BaseBuildRequestConfig,
	K extends IRequestResult
>(
	requestBuilder: T,
	timeout: number
) => Promise<IResponse<K>>;

/*
	Defines the basic logic of API request that generates important response.
	This will perform axios API request.
*/
export const generateResponse: ResponseGenerator = async <
	T extends BaseBuildRequestConfig,
	K extends IRequestResult
>(
	requestBuilder: T,
	timeout: number
): Promise<IResponse<K>> => {
	//
	const customAxios: AxiosInstance = axios.create({
		timeout: timeout,
	});

	let serverResponse;
	try {
		const config = requestBuilder['buildAxiosRequestConfig']();
		serverResponse = (await customAxios.request(config)) as AxiosResponse<
			T,
			number
		>;
	} catch (error) {
		serverResponse = (error as AxiosError).response;
	}
	const responseObject = {
		data: serverResponse?.data as K,
		headers: serverResponse?.headers as AxiosResponseHeaders,
		status: serverResponse?.status || 0,
	};
	return responseObject;
};
