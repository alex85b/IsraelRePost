import { postofficeApiCall } from "../../base/PostofficeApiCall";
import { buildTimesCallConfig } from "../FetchTimesConfig";
import { buildUsingProxyFile } from "../../../../data/models/dataTransferModels/ProxyEndpointString";
import {
	IExpectedTimesResponse,
	RequestTimesResponse,
} from "../../../../data/models/dataTransferModels/postofficeResponses/RequestTimesResponse";
import { makeUserRequest, makeUserRequestWithProxy } from "./CreateUserConfig";
import path from "path";

console.log("** Test Fetch-times Config **");

const demoDate = {
	calendarId: 2046895,
	calendarDate: "2024-07-01T00:00:00",
};

/*
	Calendar ID: 2046516
	Calendar Date: 2024-06-30T00:00:00

	Calendar ID: 2046895
	Calendar Date: 2024-07-01T00:00:00

	Calendar ID: 2047295
	Calendar Date: 2024-07-02T00:00:00

	Calendar ID: 2047699
	Calendar Date: 2024-07-03T00:00:00

	Calendar ID: 2048098
	Calendar Date: 2024-07-04T00:00:00
*/

export const makeTimesRequest = async () => {
	console.log("** (1) Make Times Request **");

	const demoService = {
		serviceId: 168,
		serviceName: "אשנב כל",
		serviceDescription: "",
		ServiceTypeId: 25,
		serviceTypeDescription: "",
		description: "עד 10 שוברים לתור",
		showStats: false,
		waitingTime: 0,
		HasCalendarService: true,
		DynamicFormsEnabled: false,
		HasFIFOService: false,
		ExtRef: "1",
		LocationId: 82,
	};

	const userResponse = await makeUserRequest();

	const config = buildTimesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		ServiceId: String(demoService.serviceId),
		CalendarId: String(demoDate.calendarId),
	});

	const response = await postofficeApiCall<IExpectedTimesResponse>(config);
	// console.log('[makeDatesRequest] raw response dayPart-0 : ', JSON.stringify(response, null, 3));
	const times = new RequestTimesResponse.Builder()
		.useAxiosResponse(response)
		.build();
	console.log("[makeDatesRequest] response dayPart-0 : ", times.toString());
	return times.getTimes();
};

export const makeTimesRequestWithProxy = async () => {
	console.log("** (2) Make Times Request **");

	const demoService = {
		serviceId: 168,
		serviceName: "אשנב כל",
		serviceDescription: "",
		ServiceTypeId: 25,
		serviceTypeDescription: "",
		description: "עד 10 שוברים לתור",
		showStats: false,
		waitingTime: 0,
		HasCalendarService: true,
		DynamicFormsEnabled: false,
		HasFIFOService: false,
		ExtRef: "1",
		LocationId: 82,
	};

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
	console.log("[makeTimesRequestWithProxy] path to env : ", envFilepath);
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
	console.log(
		"[makeTimesRequestWithProxy] path to proxy file path : ",
		proxyFilepath
	);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_WBSHA_PAS",
		envUsernameKey: "PROX_WBSHA_USR",
	});

	console.log("[makeTimesRequestWithProxy] strings demo : ", strings[0]);

	const userResponse = await makeUserRequestWithProxy();

	const config = buildTimesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		ServiceId: String(demoService.serviceId),
		CalendarId: String(demoDate.calendarId),
		endpointProxyString: strings[0],
	});

	const response = await postofficeApiCall<IExpectedTimesResponse>(config);
	// console.log('[makeTimesRequestWithProxy] raw response dayPart-0 : ', JSON.stringify(response, null, 3));
	const times = new RequestTimesResponse.Builder()
		.useAxiosResponse(response)
		.build();
	console.log(
		"[makeTimesRequestWithProxy] response dayPart-0 : ",
		times.toString()
	);
	return times.getTimes();
};
