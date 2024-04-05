import {
	IPostofficeResponseData,
	baseApiCall,
} from '../../../../api/postOfficeCalls/base/BaseApiCall';
import { buildUserCallConfig } from '../../../../api/postOfficeCalls/BuildCallConfigurations';

console.log('** Test Base Api Call **');

interface qwe extends IPostofficeResponseData {
	qwe: 'qwe!';
}

export const buildAndPerformUserRequest = async () => {
	console.log('** (1) Build And Perform User Request **');
	// const rBuilder = new BuildPostRequestAxiosConfig.Builder();
	// console.log('[buildAndPerformUserRequest] request builder created');
	// const uRequest = rBuilder.requestUrl({ url: 'CentralAPI/UserCreateAnonymous' }).build();
	// console.log('[buildAndPerformUserRequest] created a user request');
	// const response = await baseApiCall<qwe>(uRequest.getConfig());
	const response = await baseApiCall<qwe>(buildUserCallConfig());
	console.log('[buildAndPerformUserRequest] response', JSON.stringify(response));
};
