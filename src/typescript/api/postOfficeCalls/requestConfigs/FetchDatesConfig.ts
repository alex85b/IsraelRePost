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
}) => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
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
