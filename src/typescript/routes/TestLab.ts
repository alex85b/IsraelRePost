import express, { Request, Response, NextFunction, response } from 'express';
import {
	BranchModule,
	IDocumentBranch,
	INewServiceRecord,
	ISingleBranchQueryResponse,
} from '../data/elastic/BranchModel';
import { ErrorModule, IErrorMapping, IServiceError } from '../data/elastic/ErrorModel';
import { PostUserRequest } from '../api/isreal-post-requests/PostUserRequest';
import {
	IPostServiceRequired,
	PostServiceRequest,
} from '../api/isreal-post-requests/PostServiceRequest';
import { IPostDatesRequired, PostDatesRequest } from '../api/isreal-post-requests/PostDatesRequest';
import { IPostTimesRequired, PostTimesRequest } from '../api/isreal-post-requests/PostTimesRequest';
import { SmartProxyCollection } from '../data/proxy-management/SmartProxyCollection';
import { WebShareCollection } from '../data/proxy-management/WebShareCollection';
import { ContinuesUpdateRoot } from '../services/appointments-update/entry-point/ContinuesUpdateRoot';
import { BranchesToProcess } from '../data/redis/BranchesToProcess';
import { ProcessedBranches } from '../data/redis/ProcessedBranches';
// import '../test/transferable/P';
// import '../scrape-multithreaded/test/parent';

const router = express.Router();

// ###################################################################################################
// ### Route: /api/scrape/testing ####################################################################
// ###################################################################################################

router.get('/api/scrape/testing', async (req: Request, res: Response, next: NextFunction) => {
	const responses: any[] = [];
	try {
		// const cUpdate = new ContinuesUpdate(true);
		// cUpdate.test();
		res.status(200).send(responses);
	} catch (error) {
		console.log(error);
		next(error as Error);
	}
});

// ###################################################################################################
// ### Test Continues Update Q Pop ###################################################################
// ###################################################################################################

const ContinuesUpdateQPop = async (responses: any[]) => {
	const updates = new ContinuesUpdateRoot(false);
	const branchQueue = new BranchesToProcess();
	const doneQueue = new ProcessedBranches();

	let updateThis = await branchQueue.dequeueBranch();
	let processed = -1;
	if (updateThis) processed = await doneQueue.enqueueBranch(updateThis);
	let branchUpdate = {
		branchQueue: updateThis,
		doneQueue: processed,
	};

	let updateThis1 = await branchQueue.dequeueBranch();
	let processed1 = -1;
	if (updateThis1) processed1 = await doneQueue.enqueueBranch(updateThis1);
	let branchUpdate1 = {
		branchQueue: updateThis1,
		doneQueue: processed1,
	};

	let updateThis2 = await branchQueue.dequeueBranch();
	let processed2 = -1;
	if (updateThis2) processed2 = await doneQueue.enqueueBranch(updateThis2);
	let branchUpdate2 = {
		branchQueue: updateThis2,
		doneQueue: processed2,
	};

	responses.push(branchUpdate);
	responses.push(branchUpdate1);
	responses.push(branchUpdate2);
	responses.push({ dequeue: await branchQueue.queueSize() });
	responses.push({ repopulate: await updates.test() });
	return responses;
};

// ###################################################################################################
// ### Test Redis Queue - Basic ######################################################################
// ###################################################################################################

// import { bEnqueue, dequeue, enqueue, queueName, queueSize } from '../redis/RedisTest';
const testRedisQueueBasic = async (responses: any[]) => {
	const { bEnqueue, dequeue, enqueue, queueName, queueSize } = require('../redis/RedisTest');
	responses.push({ queueName: queueName });
	responses.push({ queueSize: await queueSize() });
	// responses.push({ bulkEnqueue: await bEnqueue() });
	// responses.push({ enqueue: await enqueue() });
	responses.push({ dequeue: await dequeue() });
	responses.push({ dequeue: await dequeue() });
	responses.push({ dequeue: await dequeue() });
	responses.push({ dequeue: await dequeue() });
	return responses;
};

// ###################################################################################################
// ### Test Proxies ##################################################################################
// ###################################################################################################

const testProxies = async (responses: any[]) => {
	const smartProxyCollection = new SmartProxyCollection();
	const webShareCollection = new WebShareCollection();
	responses.push({ smartProxyObject: await smartProxyCollection.getProxyObject() });
	responses.push({ webShareCollection: await webShareCollection.getProxyObject() });
	return responses;
};

// ###################################################################################################
// ### Test Elastic ##################################################################################
// ###################################################################################################

const testElastic = async (responses: any[]) => {
	const branchModule = new BranchModule();
	const errorModule = new ErrorModule();
	const allBranches = await branchModule.fetchAllBranches();
	const someBranch = allBranches[10];

	const testBranchRecord = {
		id: 1,
		branchnumber: 20999,
		branchname: 'Branch 20999',
		branchnameEN: 'Branch 1 (English)',
		city: 'City 1',
		cityEN: 'City 1 (English)',
		street: 'Street 1',
		streetEN: 'Street 1 (English)',
		streetcode: 'ABC123',
		zip: '12345',
		qnomycode: 456,
		qnomyWaitTimeCode: 789,
		haszimuntor: 1,
		isMakeAppointment: 0,
		location: {
			lat: 40.7128,
			lon: -74.006,
		},
		services: [],
	};

	const testBranchRecord_2 = {
		id: 1,
		branchnumber: 20998,
		branchname: 'Branch 20998',
		branchnameEN: 'Branch 1 (English)',
		city: 'City 1',
		cityEN: 'City 1 (English)',
		street: 'Street 1',
		streetEN: 'Street 1 (English)',
		streetcode: 'ABC123',
		zip: '12345',
		qnomycode: 456,
		qnomyWaitTimeCode: 789,
		haszimuntor: 1,
		isMakeAppointment: 0,
		location: {
			lat: 40.7128,
			lon: -74.006,
		},
		services: [],
	};

	const testErrorRecord = {
		userError: 'User encountered an error',
		services: [
			{
				serviceId: 'service_1',
				serviceError: 'Service 1 error',
				dates: [
					{
						calendarId: 'calendar_1',
						datesError: 'Dates error for calendar 1',
						timesError: 'Times error for calendar 1',
					},
					{
						calendarId: 'calendar_2',
						datesError: 'Dates error for calendar 2',
						timesError: 'Times error for calendar 2',
					},
				],
			},
			{
				serviceId: 'service_2',
				serviceError: 'Service 2 error',
				dates: [
					{
						calendarId: 'calendar_3',
						datesError: 'Dates error for calendar 3',
						timesError: 'Times error for calendar 3',
					},
				],
			},
		],
	};

	const branchesArr: IDocumentBranch[] = [];
	branchesArr.push(testBranchRecord);
	branchesArr.push(testBranchRecord_2);
	// responses.push({ delete: await errorModule.deleteIndex() });
	// responses.push({ create: await errorModule.createIndex() });
	// responses.push({ ping: await errorModule.pingIndex() });
	// responses.push({ update: await errorModule.updateAddError(testErrorRecord, 1) });
	// responses.push({ search: await errorModule.fetchAllErrors() });
	// responses.push({ bulkAdd: await branchModule.bulkAddBranches(branchesArr) });
	// responses.push({ deleteErrors: await errorModule.deleteAllErrors() });
	// responses.push({
	// 	updateServices: await branchModule.updateBranchServices('1000', [
	// 		{ serviceId: 'testID-1', serviceName: 'test-update', dates: [] },
	// 	]),
	// });
	// responses.push({ noServices: await branchModule.branchesWithoutServices() });
	responses.push({ qwe: await branchModule.fetchAllQnomyCodes() });
	return responses;
};

// ###################################################################################################
// ### Test New Post Requests ########################################################################
// ###################################################################################################

/*
	The only 'Branch' related data that needed for the chain of requests is:
		someBranch._source.qnomycode
*/

// const testNewPostRequests = async (responses: any[], someBranch: ISingleBranchQueryResponse) => {
const testNewPostRequests = async (responses: any[], qnomycode: string) => {
	const israelPostUser = new PostUserRequest(61000);
	const userResponse = await israelPostUser.makeUserRequest();
	responses.push({ userResponse: userResponse });

	const requiredForServices: IPostServiceRequired = {
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				CentralJWTCookie: userResponse.CentralJWTCookie,
				GCLB: userResponse.GCLB,
			},
		},
		url: { locationId: qnomycode, serviceTypeId: '0' },
	};

	const israelPostServices = new PostServiceRequest(61000);
	const servicesResponse = await israelPostServices.makeServiceRequest(requiredForServices);
	const someService = servicesResponse[0];
	responses.push({ servicesResponse: servicesResponse });
	const israelPostDates = new PostDatesRequest(61000);

	const requiredForDates: IPostDatesRequired = {
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				CentralJWTCookie: userResponse.CentralJWTCookie,
				GCLB: userResponse.GCLB,
			},
		},
		url: { serviceId: String(someService.serviceId) },
	};

	const datesResponse = await israelPostDates.makeDatesRequest(requiredForDates);
	responses.push({ datesResponse: datesResponse });
	const someDateId = datesResponse[0].calendarId;
	const israelTimesServices = new PostTimesRequest(61000);

	const requiredForTimes: IPostTimesRequired = {
		headers: {
			authorization: userResponse.token,
			cookies: {
				ARRAffinity: userResponse.ARRAffinity,
				ARRAffinitySameSite: userResponse.ARRAffinitySameSite,
				GCLB: userResponse.GCLB,
			},
		},
		url: {
			CalendarId: String(someDateId),
			dayPart: '0',
			ServiceId: String(someService.serviceId),
		},
	};

	const timesResponse = await israelTimesServices.makeTimesRequest(requiredForTimes);
	responses.push({ timesResponse: timesResponse });
	return responses;
};

export { router as TestLab };
