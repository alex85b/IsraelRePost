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

	const config = requestBuilder['buildAxiosRequestConfig']();
	return customAxios.request(config);
};
