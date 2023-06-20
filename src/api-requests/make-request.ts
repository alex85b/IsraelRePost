import axios from 'axios';
import { IApiRequest } from './api-request-interface';
import { BaseApiRequestBuilder } from './base-build-request';

interface IServerResponse {
	data?: any;
	axiosCookies?: string[];
	error?: Error;
}

type MakeRequestType = <T extends BaseApiRequestBuilder>(
	builder: T
) => Promise<IServerResponse>;

const MakeRequest: MakeRequestType = async (builder) => {
	try {
		const server_response = await axios.request(
			builder.buildApiRequest().config
		);
		let axiosCookies: string[] = [];
		if (server_response?.headers) {
			axiosCookies = server_response.headers['set-cookie'] || [];
		}
		const data = server_response.data;
		return { data, axiosCookies };
	} catch (err) {
		console.error(err);
		const error = err as Error;
		return { error };
	}
};

export { IServerResponse, MakeRequestType, MakeRequest };
