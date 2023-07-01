import axios from 'axios';
import { BaseApiRequestBuilder } from './base-build-request';

interface IServerResponse {
	data: any;
	axiosCookies: string[];
}

type MakeRequestType = <T extends BaseApiRequestBuilder>(
	builder: T
) => Promise<IServerResponse>;

const MakeRequest: MakeRequestType = async (builder) => {
	const server_response = await axios.request(builder.buildApiRequest().config);
	let axiosCookies: string[] = [];
	if (server_response?.headers) {
		axiosCookies = server_response.headers['set-cookie'] || [];
	}
	const data = server_response.data;
	return { data, axiosCookies };
};

export { IServerResponse, MakeRequestType, MakeRequest };
