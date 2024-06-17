import { BuildPostRequestAxiosConfig } from '../base/PostofficeRequestConfig';
import { flattenDictionaryOfCookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/ReformatCookies';
import { Cookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/PostofficeCookies';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const buildServicesCallConfig = (data: {
	headerAuth: string;
	cookies: Cookies;
	locationId: string;
	serviceTypeId?: string;
	endpointProxyString?: string;
}) => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	if (data.endpointProxyString)
		rBuilder.requestHttpsAgent({
			httpsAgent: new HttpsProxyAgent(
				// http://< Username >:< Password >@< Endpoint >:< Port >
				data.endpointProxyString
			),
		});
	const uRequest = rBuilder
		.requestUrl({ url: 'CentralAPI/LocationGetServices' })
		.headerAuthorization({ authorization: data.headerAuth })
		.headerCookies({ cookies: flattenDictionaryOfCookies(data.cookies) })
		.paramsLocationId({ locationId: data.locationId })
		.paramsServiceTypeId({ serviceTypeId: data.serviceTypeId ?? '0' })
		.build();

	return uRequest.getConfig();
};
