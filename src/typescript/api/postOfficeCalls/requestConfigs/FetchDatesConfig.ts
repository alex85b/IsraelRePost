import { HttpsProxyAgent } from 'https-proxy-agent';
import { Cookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/PostofficeCookies';
import { flattenDictionaryOfCookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/ReformatCookies';
import { getTodayDateObject } from '../../elastic/shared/TodaysDate';
import { BuildPostRequestAxiosConfig } from '../base/PostofficeRequestConfig';

export const buildDatesCallConfig = (data: {
	headerAuth: string;
	cookies: Cookies;
	serviceId: string;
	maxResults?: string;
	startDate?: string;
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
	const dRequest = rBuilder
		.requestUrl({ url: 'CentralAPI/SearchAvailableDates' })
		.headerAuthorization({ authorization: data.headerAuth })
		.headerCookies({ cookies: flattenDictionaryOfCookies(data.cookies) })
		.paramsMaxResults({ maxResults: data.maxResults ?? '30' })
		.paramsServiceId({ serviceId: data.serviceId })
		.paramsStartDate({ startDate: data.startDate ?? getTodayDateObject().date })
		.build();
	return dRequest.getConfig();
};
