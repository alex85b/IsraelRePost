import { SearchAvailableSlots } from '../api-requests/SearchAvailableSlots';
import { BadApiResponse } from '../errors/BadApiResponse';
import { getSharedData } from './SharedData';

export const getTimesOfDateOfServiceOfBranch = async (
	cookies: {
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		GCLB: string;
	},
	urlAttributes: { CalendarId: string; dayPart: string; ServiceId: string },
	headers: { token: string },
	useProxy: boolean,
	proxyUrl: string,
	proxyAuth: { username: string; password: string }
) => {
	const searchAvailableSlots = new SearchAvailableSlots();
	try {
		const hoursResponse = await searchAvailableSlots.makeRequest(
			useProxy,
			proxyUrl,
			proxyAuth,
			{
				ARRAffinity: cookies.ARRAffinity,
				ARRAffinitySameSite: cookies.ARRAffinitySameSite,
				GCLB: cookies.GCLB,
			},
			{
				CalendarId: urlAttributes.CalendarId,
				dayPart: urlAttributes.dayPart,
				ServiceId: urlAttributes.ServiceId,
			},
			{ token: headers.token }
		);
		if (hoursResponse.data.Success !== 'true') {
			throw new BadApiResponse({
				message: 'Success key is false',
				source: 'getTimesOfDateOfServiceOfBranch',
			});
		}
		if (
			hoursResponse.data.TotalResults === '0' ||
			hoursResponse.nested.length === 0
		) {
			console.error(
				'[getTimesOfDateOfServiceOfBranch] no times for branch-service-date combo'
			);
		}
		return hoursResponse.nested;
	} catch (error) {
		console.error('[getTimesOfDateOfServiceOfBranch] Failed!');
		throw error;
	}
};
