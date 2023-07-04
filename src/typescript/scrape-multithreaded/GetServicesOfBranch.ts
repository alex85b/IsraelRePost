import { LocationGetServices } from '../api-requests/LocationGetServices';
import { BadApiResponse } from '../errors/BadApiResponse';

export const getServicesOfBranch = async (
	cookies: {
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		CentralJWTCookie: string;
		GCLB: string;
	},
	urlAttributes: { locationId: string; serviceTypeId: string },
	headers: { token: string },
	useProxy: boolean,
	proxyUrl: string,
	proxyAuth: { username: string; password: string }
) => {
	try {
		const locationGetServices = new LocationGetServices();
		const servicesResponse = await locationGetServices.makeRequest(
			useProxy,
			proxyUrl,
			proxyAuth,
			{
				ARRAffinity: cookies.ARRAffinity,
				ARRAffinitySameSite: cookies.ARRAffinitySameSite,
				CentralJWTCookie: cookies.CentralJWTCookie,
				GCLB: cookies.GCLB,
			},
			{
				locationId: urlAttributes.locationId,
				serviceTypeId: urlAttributes.serviceTypeId,
			},
			{ token: headers.token }
		);

		if (servicesResponse.data.Success !== 'true') {
			throw new BadApiResponse({
				message: 'Success key is false',
				source: 'getServicesOfBranch',
			});
		}

		if (
			servicesResponse.data.TotalResults === '0' ||
			servicesResponse.nested.length === 0
		) {
			console.error('[getServicesOfBranch] no services for the branch');
		}

		return servicesResponse.nested;
	} catch (error) {
		console.error('[getServicesOfBranch] Failed!');
		throw error;
	}
};
