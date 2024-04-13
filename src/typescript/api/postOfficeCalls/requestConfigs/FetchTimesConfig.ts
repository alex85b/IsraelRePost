import { Cookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/PostofficeCookies';
import { flattenDictionaryOfCookies } from '../../../data/models/dataTransferModels/postofficeResponses/shared/ReformatCookies';
import { BuildPostRequestAxiosConfig } from '../base/PostofficeRequestConfig';

export type CookiesWithoutCentralJWT = Omit<Cookies, 'CentralJWTCookie'>;

export const buildTimesCallConfig = (data: {
	headerAuth: string;
	cookies: CookiesWithoutCentralJWT;
	CalendarId: string;
	ServiceId: string;
	dayPart?: string;
}) => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	const tRequest = rBuilder
		.requestUrl({ url: 'CentralAPI/SearchAvailableSlots' })
		.headerAuthorization({ authorization: data.headerAuth })
		.headerCookies({ cookies: flattenDictionaryOfCookies(data.cookies) })
		.paramsCalendarId({ CalendarId: data.CalendarId })
		.paramsServiceId({ serviceId: data.ServiceId })
		.paramsDayPart({ dayPart: data.dayPart ?? '0' })
		.build();
	return tRequest.getConfig();
};
