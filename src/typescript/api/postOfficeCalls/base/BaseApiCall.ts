import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IPostofficeRequestAxiosConfig } from './BaseRequestConfig';

export interface IPostofficeResponseData {
	Success: boolean;
	Results: { [key: string]: any }[] | { [key: string]: any } | null;
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: string | null;
	ErrorNumber: number;
	Messages: { [key: string]: any }[] | null;
}

export interface IPostOfficeApiResponse<SR extends IPostofficeResponseData> {
	status: number;
	statusText: string;
	cookies: string[];
	responseData: SR;
}

export type BaseApiCall = <SR extends IPostofficeResponseData>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => Promise<IPostOfficeApiResponse<SR>>;

export const baseApiCall: BaseApiCall = async <SR extends IPostofficeResponseData>(
	axiosRequestConfig: IPostofficeRequestAxiosConfig
) => {
	try {
		const israelPostResponse = await axios.request<
			IPostofficeRequestAxiosConfig,
			AxiosResponse<SR>,
			AxiosRequestConfig
		>(axiosRequestConfig);
		return {
			status: israelPostResponse.status ?? -1,
			statusText: israelPostResponse.statusText ?? '',
			cookies: israelPostResponse.headers['set-cookie'] ?? [],
			responseData: israelPostResponse.data,
		};
	} catch (error) {
		throw new Error('[israelPostRequest] Error : ' + (error as Error).message);
	}
};
