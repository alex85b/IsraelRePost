import { RequestCounter } from '../../atomic-counter/RequestCounter';
import { RequestsAllowed } from '../../atomic-counter/RequestsAllowed';
import { BranchModule, INewServiceRecord } from '../../elastic/BranchModel';
import { IErrorMapping } from '../../elastic/ErrorModel';
import { IPostDatesRequired, PostDatesRequest } from '../../isreal-post-requests/PostDatesRequest';
import {
	IPostServiceRequired,
	PostServiceRequest,
} from '../../isreal-post-requests/PostServiceRequest';
import { IPostTimesRequired, PostTimesRequest } from '../../isreal-post-requests/PostTimesRequest';
import { PostUserRequest } from '../../isreal-post-requests/PostUserRequest';
import { SmartProxyCollection } from '../../proxy-management/SmartProxyCollection';

// ###################################################################################################
// ### Test Israel Post APIs #########################################################################
// ###################################################################################################

const testAPIs = async (run: boolean) => {
	if (!run) return;
	console.log('[testAPIs] Start');

	const branchModule = new BranchModule();
	const allBranches = await branchModule.fetchAllBranches();
	const someBranch = allBranches[91];

	const requestsAllowed = new RequestsAllowed();
	const requestCounter = new RequestCounter();

	const updatedServices: INewServiceRecord[] = [];
	const IsraelPostApiErrors: IErrorMapping = {
		userError: '',
		services: [],
	};

	const proxyCollection = new SmartProxyCollection();
	const endpoints = await proxyCollection.getProxyObject();
	// const someEndpoint = endpoints[0];
	const someEndpoint = undefined;

	const userRequest = new PostUserRequest(120000, someEndpoint);
	const userResponse = await userRequest.makeUserRequest();
	console.log('[testAPIs] userResponse : ', userResponse);

	const serviceRequest = new PostServiceRequest(120000, someEndpoint);
	const serviceRequired: IPostServiceRequired = {
		url: {
			locationId: String(someBranch._source.qnomycode),
			serviceTypeId: '0',
		},
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				CentralJWTCookie: userResponse.CentralJWTCookie,
				GCLB: userResponse.GCLB,
			},
		},
	};
	const serviceResponse = await serviceRequest.makeServiceRequest(serviceRequired);
	console.log('[testAPIs] serviceResponse : ', serviceResponse);

	const someService = serviceResponse[0];

	const dateRequest = new PostDatesRequest(120000, someEndpoint);
	const postDatesRequired: IPostDatesRequired = {
		url: {
			serviceId: String(someService.serviceId),
		},
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				CentralJWTCookie: userResponse.CentralJWTCookie,
				GCLB: userResponse.GCLB,
			},
		},
	};
	const dateResponse = await dateRequest.makeDatesRequest(postDatesRequired);
	console.log('[testAPIs] dateResponse : ', dateResponse);

	const someDate = dateResponse[0];

	const timesRequest = new PostTimesRequest(120000, someEndpoint);
	const timesRequired: IPostTimesRequired = {
		url: {
			CalendarId: String(someDate.calendarId),
			ServiceId: String(someService.serviceId),
			dayPart: '1',
		},
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				GCLB: userResponse.GCLB,
			},
		},
	};
	const timesResponse = await timesRequest.makeTimesRequest(timesRequired);
	console.log('[testAPIs] timesResponse : ', timesResponse);
	console.log('[testAPIs] End');
};

export { testAPIs };
