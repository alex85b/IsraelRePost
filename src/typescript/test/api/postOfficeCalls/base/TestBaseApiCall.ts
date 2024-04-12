import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { BuildPostRequestAxiosConfig } from '../../../../api/postOfficeCalls/base/PostofficeRequestConfig';

console.log('** Test Base Api Call **');

export const buildAndPerformUserRequest = async () => {
	console.log('** (1) Build And Perform User Request **');
	const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	console.log('[buildAndPerformUserRequest] request builder created');
	const uRequest = rBuilder.requestUrl({ url: 'CentralAPI/UserCreateAnonymous' }).build();
	console.log('[buildAndPerformUserRequest] created a user request');
	const response = await postofficeApiCall(uRequest.getConfig());
	console.log('[buildAndPerformUserRequest] response', response);
};
