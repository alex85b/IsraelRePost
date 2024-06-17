import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildDatesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchDatesConfig';
import { buildUsingProxyFile } from '../../../../data/models/dataTransferModels/ProxyEndpointString';
import {
	IExpectedDatesResponse,
	RequestDatesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestDatesResponse';
import { makeUserRequest, makeUserRequestWithProxy } from './TestCreateUserConfig';
import path from 'path';

console.log('** Test Fetch-dates Config **');

export const makeDatesRequest = async () => {
	console.log('** (1) Make Dates Request **');

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

	const userResponse = await makeUserRequest();

	const config = buildDatesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		serviceId: String(demoService.serviceId),
	});

	// console.log('[makeDatesRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedDatesResponse>(config);
	// console.log('[makeDatesRequest] response : ', JSON.stringify(response, null, 3));
	const dates = new RequestDatesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeDatesRequest] services : ', dates.toString());
	return dates.getDates();
};

export const makeDatesRequestWithProxy = async () => {
	console.log('** (2) Make Dates Request **');

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

	const envFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '.env');
	console.log('[makeDatesRequestWithProxy] path to env : ', envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'..',
		'..',
		'SmartProxy.txt'
	);
	console.log('[makeDatesRequestWithProxy] path to proxy file path : ', proxyFilepath);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: 'PROX_SMRT_PAS',
		envUsernameKey: 'PROX_SMRT_USR',
	});

	console.log('[makeDatesRequestWithProxy] strings demo : ', strings[0]);

	const userResponse = await makeUserRequestWithProxy();

	const config = buildDatesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		serviceId: String(demoService.serviceId),
		endpointProxyString: strings[0],
	});

	// console.log('[makeDatesRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedDatesResponse>(config);
	// console.log('[makeDatesRequest] response : ', JSON.stringify(response, null, 3));
	const dates = new RequestDatesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeDatesRequestWithProxy] services : ', dates.toString());
	return dates.getDates();
};
