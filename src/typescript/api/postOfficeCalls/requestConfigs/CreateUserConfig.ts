import { BuildPostRequestAxiosConfig } from '../base/PostofficeRequestConfig';

export const buildUserCallConfig = () => {
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	const uRequest = rBuilder.requestUrl({ url: 'CentralAPI/UserCreateAnonymous' }).build();
	return uRequest.getConfig();
};
