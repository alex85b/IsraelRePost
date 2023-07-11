// import { SearchAvailableDates } from '../api-requests/SearchAvailableDates';
// import { BadApiResponse } from '../errors/BadApiResponse';

// export const getDatesOfServiceOfBranch = async (
// 	cookies: {
// 		ARRAffinity: string;
// 		ARRAffinitySameSite: string;
// 		GCLB: string;
// 	},
// 	urlAttributes: { serviceId: string; startDate: string },
// 	headers: { token: string },
// 	useProxy: boolean,
// 	proxyUrl: string,
// 	proxyAuth: { username: string; password: string }
// ) => {
// 	try {
// 		const searchAvailableDates = new SearchAvailableDates();
// 		const datesResponse = await searchAvailableDates.makeRequest(
// 			useProxy,
// 			proxyUrl,
// 			proxyAuth,
// 			{
// 				ARRAffinity: cookies.ARRAffinity,
// 				ARRAffinitySameSite: cookies.ARRAffinitySameSite,
// 				GCLB: cookies.GCLB,
// 			},
// 			{ serviceId: urlAttributes.serviceId, startDate: urlAttributes.serviceId },
// 			{ token: headers.token }
// 		);

// 		if (datesResponse.data.Success !== 'true') {
// 			throw new BadApiResponse({
// 				message: 'Success key is false',
// 				source: 'getDatesOfServiceOfBranch',
// 			});
// 		}

// 		if (
// 			datesResponse.data.TotalResults === '0' ||
// 			datesResponse.nested.length === 0
// 		) {
// 			console.error(
// 				'[getDatesOfServiceOfBranch] no dates for branch-service combo'
// 			);
// 		}

// 		return datesResponse.nested;
// 	} catch (error) {
// 		console.error('[getDatesOfServiceOfBranch] Failed!');
// 		throw error;
// 	}
// };
