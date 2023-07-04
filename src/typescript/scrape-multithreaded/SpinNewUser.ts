import { UserCreateAnonymous } from '../api-requests/UserCreateAnonymous';
import { stringFieldExistNonEmpty } from '../common/StringFieldExistNonEmpty';
import { BadApiResponse } from '../errors/BadApiResponse';

export const spinNewUser = async (
	useProxy: boolean,
	proxyUrl: string,
	proxyAuth: { username: string; password: string }
) => {
	try {
		// console.log('[spinNewUser] [proxyUrl]: ', proxyUrl);
		// console.log('[spinNewUser] [proxyAuth]: ', proxyAuth);
		const userCreateAnonymous = new UserCreateAnonymous();
		const anonymousResponse = await userCreateAnonymous.makeRequest(
			useProxy,
			proxyUrl,
			proxyAuth
		);

		if (anonymousResponse.data?.Success !== 'true') {
			throw new BadApiResponse({
				message: 'Success key is false',
				source: 'spinNewUser',
			});
		}

		if (!stringFieldExistNonEmpty(anonymousResponse.data?.token)) {
			throw new BadApiResponse({
				message: 'Html token is invalid',
				source: 'spinNewUser',
			});
		}

		if (!stringFieldExistNonEmpty(anonymousResponse.cookies?.ARRAffinity)) {
			throw new BadApiResponse({
				message: 'ARRAffinity cookie is invalid',
				source: 'spinNewUser',
			});
		}

		if (
			!stringFieldExistNonEmpty(anonymousResponse.cookies?.ARRAffinitySameSite)
		) {
			throw new BadApiResponse({
				message: 'ARRAffinitySameSite cookie is invalid',
				source: 'spinNewUser',
			});
		}

		if (!stringFieldExistNonEmpty(anonymousResponse.cookies?.CentralJWTCookie)) {
			throw new BadApiResponse({
				message: 'CentralJWTCookie cookie is invalid',
				source: 'spinNewUser',
			});
		}

		if (!stringFieldExistNonEmpty(anonymousResponse.cookies?.GCLB)) {
			throw new BadApiResponse({
				message: 'GCLB cookie is invalid',
				source: 'spinNewUser',
			});
		}

		return anonymousResponse;
	} catch (error) {
		console.error('[spinNewUser] Failed!');
		throw error;
	}
};
