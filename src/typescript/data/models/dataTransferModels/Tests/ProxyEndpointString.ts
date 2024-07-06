import { buildUsingProxyFile } from "../ProxyEndpointString";
import path from "path";

console.log("** Test Proxy Endpoint String **");

export const endpointProxiesStrings = async () => {
	console.log("** (1) Test Proxy Endpoint String | Smart Proxy Strings **");
	const envFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		".env"
	);
	console.log("[smartProxyStrings] path to env : ", envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"WebShare.txt"
	);
	console.log("[smartProxyStrings] path to proxy file path : ", proxyFilepath);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_WBSHA_PAS",
		envUsernameKey: "PROX_WBSHA_USR",
	});
	console.log("[smartProxyStrings] strings : ", strings);
};
