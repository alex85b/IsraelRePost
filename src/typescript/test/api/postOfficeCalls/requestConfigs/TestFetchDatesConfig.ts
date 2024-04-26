import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildDatesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchDatesConfig';
import {
	IExpectedDatesResponse,
	RequestDatesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestDatesResponse';
import { makeUserRequest } from './TestCreateUserConfig';

console.log('** Test Fetch-dates Config **');

export const makeDatesRequest = async () => {
	console.log('** (3) Make Dates Request **');

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
