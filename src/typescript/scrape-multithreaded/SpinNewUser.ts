import { UserCreateAnonymous } from '../api-requests/UserCreateAnonymous';
import { BadApiResponse } from '../errors/BadApiResponse';

export const spinNewUser = async (oldUsername: string) => {
	const userCreateAnonymous = new UserCreateAnonymous();
	const anonymousResponse = await userCreateAnonymous.makeRequest();
	if (anonymousResponse.data.Success !== 'true') {
		throw new BadApiResponse({
			message: 'Success key is false',
			source: 'spinNewUser',
		});
	} else if (anonymousResponse.data.username === oldUsername) {
		throw new BadApiResponse({
			message: 'username has not changed',
			source: 'spinNewUser',
		});
	}

	return anonymousResponse;
};
