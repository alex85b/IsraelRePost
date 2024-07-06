import { postofficeApiCall } from "../../base/PostofficeApiCall";
import { buildUserCallConfig } from "../CreateUserConfig";
import { buildUsingProxyFile } from "../../../../data/models/dataTransferModels/ProxyEndpointString";
import {
	IExpectedUserResponse,
	RequestUserResponse,
} from "../../../../data/models/dataTransferModels/postofficeResponses/RequestUserResponse";
import path from "path";

console.log("** Test Create-User Config **");

export const makeUserRequest = async () => {
	console.log("** (1) Make User Request **");
	const config = buildUserCallConfig();
	// console.log('[makeUserRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedUserResponse>(config);
	const userResponse = new RequestUserResponse.Builder()
		.useAxiosResponse(response)
		.build();
	// console.log('[makeUserRequest] Cookies : ', userResponse.getCookies());
	// console.log('[makeUserRequest] Token : ', userResponse.getToken());
	return userResponse;
};

export const makeUserRequestWithProxy = async () => {
	console.log("** (2) Make User Request With Proxy **");

	const envFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		".env"
	);
	console.log("[makeUserRequestWithProxy] path to env : ", envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"SmartProxy.txt"
	);
	console.log(
		"[makeUserRequestWithProxy] path to proxy file path : ",
		proxyFilepath
	);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_SMRT_PAS",
		envUsernameKey: "PROX_SMRT_USR",
	});
	console.log("[makeUserRequestWithProxy] strings demo : ", strings[0]);
	const config = buildUserCallConfig(strings[0]);
	// console.log(
	// 	"[makeUserRequest] request config",
	// 	JSON.stringify(config, null, 3)
	// );
	const response = await postofficeApiCall<IExpectedUserResponse>(config);
	const userResponse = new RequestUserResponse.Builder()
		.useAxiosResponse(response)
		.build();
	console.log("[makeUserRequest] Cookies : ", userResponse.getCookies());
	console.log("[makeUserRequest] Token : ", userResponse.getToken());
	return userResponse;
};
