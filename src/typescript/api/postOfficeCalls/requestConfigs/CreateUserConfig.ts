import { HttpsProxyAgent } from 'https-proxy-agent';
import {
	BuildPostRequestAxiosConfig,
	IPostofficeRequestAxiosConfig,
} from '../base/PostofficeRequestConfig';

export const buildUserCallConfig = (
	endpointProxyString?: string
): IPostofficeRequestAxiosConfig => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	if (endpointProxyString) {
		rBuilder.requestHttpsAgent({
			httpsAgent: new HttpsProxyAgent(
				// http://< Username >:< Password >@< Endpoint >:< Port >
				endpointProxyString
			),
		});
	}
	const uRequest = rBuilder.requestUrl({ url: 'CentralAPI/UserCreateAnonymous' }).build();
	return uRequest.getConfig();
};
