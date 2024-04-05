import { BuildPostRequestAxiosConfig } from './base/BaseRequestConfig';
import {} from './utils/ReformatCookies';

export const buildUserCallConfig = () => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	const uRequest = rBuilder.requestUrl({ url: 'CentralAPI/UserCreateAnonymous' }).build();
	return uRequest.getConfig();
};

/*
axiosRequestConfig.headers.Cookie = this.reformatCookiesForAxios(headers.cookies);
axiosRequestConfig.params = {
	locationId: url.locationId,
	serviceTypeId: url.serviceTypeId,
};
*/

// export const buildServicesCallConfig = (data: { headerAuth: string; cookies: string[] }) => {
// 	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
// 	const uRequest = rBuilder
// 		.requestUrl({ url: 'CentralAPI/LocationGetServices' })
// 		.headerAuthorization({ authorization: data.headerAuth })
// 		.headerCookies({ cookies: flattenArrayOfCookies() })
// 		.build();
// 	return uRequest.getConfig();
// };
