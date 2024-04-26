import { IExpectedDatesResponse } from '../../../../api/apiCalls/DatesRequest';
import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildTimesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchTimesConfig';
import {
	IExpectedTimesResponse,
	RequestTimesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestTimesResponse';
import { makeUserRequest } from './TestCreateUserConfig';

console.log('** Test Fetch-times Config **');

export const makeTimesRequest = async () => {
	console.log('** (4) Make Times Request **');

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
