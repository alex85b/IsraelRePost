import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildTimesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchTimesConfig';
import { buildUsingProxyFile } from '../../../../data/models/dataTransferModels/ProxyEndpointString';
import {
	IExpectedTimesResponse,
	RequestTimesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestTimesResponse';
import { makeUserRequest, makeUserRequestWithProxy } from './TestCreateUserConfig';
import path from 'path';

console.log('** Test Fetch-times Config **');

export const makeTimesRequest = async () => {
	console.log('** (1) Make Times Request **');

	const demoService = {
		serviceId: 168,
		serviceName: 'אשנב כל',
		serviceDescription: '',
		ServiceTypeId: 25,
		serviceTypeDescription: '',
		description: 'עד 10 שוברים לתור',
		showStats: false,
		waitingTime: 0,
		HasCalendarService: true,
		DynamicFormsEnabled: false,
		HasFIFOService: false,
		ExtRef: '1',
		LocationId: 82,
	};

	const demoDate = {
		calendarDate: '2024-04-16T00:00:00',
		calendarId: 2022785,
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
	const times = new RequestTimesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeDatesRequest] response dayPart-0 : ', times.toString());
	return times.getTimes();
};

export const makeTimesRequestWithProxy = async () => {
	console.log('** (2) Make Times Request **');

	const demoService = {
		serviceId: 168,
		serviceName: 'אשנב כל',
		serviceDescription: '',
		ServiceTypeId: 25,
		serviceTypeDescription: '',
		description: 'עד 10 שוברים לתור',
		showStats: false,
		waitingTime: 0,
		HasCalendarService: true,
		DynamicFormsEnabled: false,
		HasFIFOService: false,
		ExtRef: '1',
		LocationId: 82,
	};

	const demoDate = {
		calendarDate: '2024-05-30T00:00:00',
		calendarId: 2036937,
	};

	/*
	Calendar ID: 2035328
	Calendar Date: 2024-05-26T00:00:00

	Calendar ID: 2035730
	Calendar Date: 2024-05-27T00:00:00

	Calendar ID: 2036142
	Calendar Date: 2024-05-28T00:00:00

	Calendar ID: 2036531
	Calendar Date: 2024-05-29T00:00:00

	Calendar ID: 2036937
	Calendar Date: 2024-05-30T00:00:00
	*/

	const envFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '.env');
	console.log('[makeTimesRequestWithProxy] path to env : ', envFilepath);
	const proxyFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'WebShare.txt');
	console.log('[makeTimesRequestWithProxy] path to proxy file path : ', proxyFilepath);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: 'PROX_WBSHA_PAS',
		envUsernameKey: 'PROX_WBSHA_USR',
	});

	console.log('[makeTimesRequestWithProxy] strings demo : ', strings[0]);

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
	const times = new RequestTimesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeTimesRequestWithProxy] response dayPart-0 : ', times.toString());
	return times.getTimes();
};
