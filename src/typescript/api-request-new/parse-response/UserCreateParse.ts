import { parseResponseCookies } from '../../common/ParseCookies';
import { BadApiResponse } from '../../errors/BadApiResponse';
import { IRequestResult, IResponse } from '../GenerateResponse';

export interface IUserCreateResult extends IRequestResult {
	Results: {
		token: string;
		username: string;
	};
}

export const parseUserCreateResponse = (
	responseObject: IResponse<IUserCreateResult>
) => {
	const { data, headers } = responseObject;

	const token = data.Results?.token;
	const rawCookies = headers['set-cookie'];
	if (!rawCookies)
		throw new BadApiResponse({
			message: 'User create returned no cookies',
			source: 'parseUserCreateResponse',
			data: {
				headers: headers,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});
	const cookies = parseResponseCookies(rawCookies);
	const CentralJWTCookie = cookies['CentralJWTCookie'];
	const ARRAffinity = cookies['ARRAffinity'];
	const ARRAffinitySameSite = cookies['ARRAffinitySameSite'];
	const GCLB = cookies['GCLB'];

	if (!CentralJWTCookie || !ARRAffinity || !ARRAffinitySameSite || !GCLB) {
		throw new BadApiResponse({
			message: 'User create missing one or more cookie',
			source: 'parseUserCreateResponse',
			data: {
				cookies: cookies,
				status: data.status,
				isSuccessful: data.Success,
				errorMessage: data.ErrorMessage,
			},
		});
	}

	return {
		data: { token: token },
		headers: {
			Cookie: {
				CentralJWTCookie: CentralJWTCookie,
				ARRAffinity: ARRAffinity,
				ARRAffinitySameSite: ARRAffinitySameSite,
				GCLB: GCLB,
			},
		},
	};
};
