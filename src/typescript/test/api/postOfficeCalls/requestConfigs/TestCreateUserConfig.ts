import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildUserCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/CreateUserConfig';
import {
	IExpectedUserResponse,
	RequestUserResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestUserResponse';

console.log('** Test Create-User Config **');

export const makeUserRequest = async () => {
	console.log('** (1) Make User Request **');
	const config = buildUserCallConfig();
	// console.log('[makeUserRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedUserResponse>(config);
	// console.log('[makeUserRequest] response : ', response);
	const userResponse = new RequestUserResponse.Builder().useAxiosResponse(response).build();
	// console.log('[makeUserRequest] Cookies : ', userResponse.getCookies());
	// console.log('[makeUserRequest] Token : ', userResponse.getToken());
	return userResponse;
};
