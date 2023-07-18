// import { parentPort, workerData } from 'worker_threads';
// import { IProxyAuthObject, IWorkerData } from './ManageThreads';
// import { generateResponse } from '../api-request-new/GenerateResponse';
// import {
// 	IGetServicesResult,
// 	parseGetServicesResponse,
// } from '../api-request-new/parse-response/GetServicesParse';
// import {
// 	ISearchDatesResult,
// 	parseSearchDatesResponse,
// } from '../api-request-new/parse-response/SearchDatesParse';
// import {
// 	ISearchTimesResult,
// 	parseSearchTimesResponse,
// } from '../api-request-new/parse-response/SearchTimesParse';
// import {
// 	IUserCreateResult,
// 	parseUserCreateResponse,
// } from '../api-request-new/parse-response/UserCreateParse';
// import { GetServicesConfig } from '../api-request-new/requests-config/GetServicesConfig';
// import { SearchDatesConfig } from '../api-request-new/requests-config/SearchDatesConfig';
// import { SearchTimesConfig } from '../api-request-new/requests-config/SearchTimesConfig';
// import { UserCreateConfig } from '../api-request-new/requests-config/UserCreateConfig';
// import { NotProvided } from '../errors/NotProvided';
// import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';

// export interface IWorkerRerun {
// 	id: number;
// 	type: 'rerun';
// 	attachment: ISingleBranchQueryResponse[];
// }

// const processBranchWrapper = async () => {
// 	const { id, branches, proxyConfig } = workerData as IWorkerData;
// 	const failedBranches: ISingleBranchQueryResponse[] = [];

// 	if (!id || typeof id !== 'number' || id < 1)
// 		throw new NotProvided({
// 			message: 'id workerdata is invalid',
// 			source: 'processBranchWrapper',
// 		});

// 	if (!branches || !Array.isArray(branches) || branches.length < 1)
// 		throw new NotProvided({
// 			message: 'branches workerdata is invalid',
// 			source: 'processBranchWrapper',
// 		});

// 	if (
// 		!proxyConfig ||
// 		typeof proxyConfig.useProxy !== 'boolean' ||
// 		typeof proxyConfig.proxyUrl !== 'string' ||
// 		!proxyConfig.proxyAuth ||
// 		typeof proxyConfig.proxyAuth.password !== 'string' ||
// 		typeof proxyConfig.proxyAuth.username !== 'string'
// 	)
// 		throw new NotProvided({
// 			message: `proxyDef workerdata is invalid: ${proxyConfig}`,
// 			source: 'processBranchWrapper',
// 		});

// 	parentPort?.once('message', async (message: any) => {
// 		if (message?.type && message?.type === 'run') {
// 			while (branches) {
// 				const currentBranch = branches.pop();
// 				if (!currentBranch) break;
// 				try {
// 					//? Here should be a 'set timeout --> throw error.'
// 					const processResult = await processBranch(currentBranch, id, proxyConfig);
// 					console.log(processResult);

// 					if (!processResult.success) {
// 						failedBranches.push(currentBranch);
// 					}
// 				} catch (error) {
// 					throw error as Error;
// 				}
// 			}
// 		}
// 		if (failedBranches.length > 0) {
// 			const message: IWorkerRerun = {
// 				id: id,
// 				type: 'rerun',
// 				attachment: failedBranches,
// 			};
// 			parentPort?.postMessage(message);
// 		}
// 		process.exit(0);
// 	});
// };

// const requestCoordinator = async (id: number) => {
// 	await new Promise((resolve, reject) => {
// 		parentPort?.postMessage({ id: id, type: 'req' });
// 		parentPort?.once('message', (message) => {
// 			resolve(message);
// 		});
// 	});
// };

// export interface progressTracking {
// 	status: string;
// 	branchNumber: number;
// 	branchName: string;
// 	serviceId: number;
// 	date: string;
// 	time: string;
// 	debug?: any;
// }

// const processBranch = async (
// 	branch: ISingleBranchQueryResponse,
// 	id = -1,
// 	proxyConfig: IProxyAuthObject
// ) => {
// 	let lastStep: progressTracking = {
// 		status: 'start',
// 		branchNumber: branch._source.branchnumber,
// 		branchName: branch._source.branchnameEN,
// 		serviceId: -1,
// 		date: '',
// 		time: '',
// 	};
// 	try {
// 		const userConfigBuilder = new UserCreateConfig(proxyConfig);

// 		await requestCoordinator(id);
// 		const createResponse = await generateResponse<
// 			UserCreateConfig,
// 			IUserCreateResult
// 		>(userConfigBuilder, 40000);
// 		lastStep.debug = createResponse;
// 		const parsedCreateResponse = parseUserCreateResponse(createResponse);
// 		lastStep.status = 'After: parsedCreateResponse';

// 		const commonConfigInput = {
// 			...parsedCreateResponse,
// 			proxyAuth: proxyConfig.proxyAuth,
// 			proxyUrl: proxyConfig.proxyUrl,
// 			useProxy: proxyConfig.useProxy,
// 		};

// 		const servicesConfigBuilder = new GetServicesConfig({
// 			...commonConfigInput,
// 			url: { locationId: String(branch._source.qnomycode), serviceTypeId: '0' },
// 		});

// 		await requestCoordinator(id);
// 		const servicesResponse = await generateResponse<
// 			GetServicesConfig,
// 			IGetServicesResult
// 		>(servicesConfigBuilder, 40000);
// 		lastStep.debug = servicesResponse;
// 		const parsedServicesResponse =
// 			parseGetServicesResponse(servicesResponse).Results;
// 		lastStep.status = 'After: parsedServicesResponse';
// 		for (const service of parsedServicesResponse) {
// 			const { serviceId, ServiceTypeId } = service;
// 			lastStep.serviceId = serviceId;

// 			const searchDatesBuilder = new SearchDatesConfig({
// 				...commonConfigInput,
// 				url: { serviceId: String(serviceId), serviceTypeId: String(ServiceTypeId) },
// 			});

// 			await requestCoordinator(id);
// 			const datesResponse = await generateResponse<
// 				SearchDatesConfig,
// 				ISearchDatesResult
// 			>(searchDatesBuilder, 40000);
// 			lastStep.debug = datesResponse;
// 			const parsedDatesResponse = parseSearchDatesResponse(datesResponse).Results;
// 			lastStep.status = 'After: parsedDatesResponse';
// 			for (const date of parsedDatesResponse) {
// 				const { calendarId, calendarDate } = date;
// 				lastStep.date = calendarDate;

// 				const searchTimesBuilder = new SearchTimesConfig({
// 					...commonConfigInput,
// 					url: {
// 						CalendarId: String(calendarId),
// 						ServiceId: String(serviceId),
// 						dayPart: '0',
// 					},
// 				});

// 				await requestCoordinator(id);
// 				const timesResponse = await generateResponse<
// 					SearchTimesConfig,
// 					ISearchTimesResult
// 				>(searchTimesBuilder, 40000);
// 				lastStep.debug = timesResponse;
// 				const parsedTimesResponse = parseSearchTimesResponse(timesResponse).Results;
// 				lastStep.status = 'After: parsedTimesResponse';
// 			}
// 		}

// 		return {
// 			success: true,
// 			lastStep: null,
// 			data: {
// 				branchName: lastStep.branchName,
// 				branchNumber: lastStep.branchNumber,
// 			},
// 		};
// 	} catch (error) {
// 		return {
// 			success: false,
// 			lastStep: lastStep,
// 			data: {
// 				branch: branch._source,
// 				error: error as Error,
// 			},
// 		};
// 	}
// };

// const helperValidateWorkerData = (proxyConfig: IProxyAuthObject) => {
// 	const proxyConfigqe = proxyConfig === null || proxyConfig === undefined;
// 	const useProxy = typeof proxyConfig?.useProxy === 'boolean';
// 	const proxyUrl = typeof proxyConfig?.proxyUrl === 'string';
// 	const proxyAuth =
// 		proxyConfig?.proxyAuth === null || proxyConfig?.proxyAuth === undefined;
// 	const password = typeof proxyConfig?.proxyAuth?.password !== 'string';
// 	const username = typeof proxyConfig?.proxyAuth?.username !== 'string';

// 	const tests: {}[] = [];
// 	tests.push({ proxyConfig: proxyConfig === null || proxyConfig === undefined });
// 	tests.push({ useProxy: typeof proxyConfig?.useProxy === 'boolean' });

// 	// if (
// 	// 	!proxyConfig ||
// 	// 	typeof proxyConfig.useProxy !== 'boolean' ||
// 	// 	typeof proxyConfig.proxyUrl !== 'string' ||
// 	// 	!proxyConfig.proxyAuth ||
// 	// 	typeof proxyConfig.proxyAuth.password !== 'string' ||
// 	// 	typeof proxyConfig.proxyAuth.username !== 'string'
// 	// )
// 	// 	throw new NotProvided({
// 	// 		message: `proxyDef workerdata is invalid: ${proxyConfig}`,
// 	// 		source: 'processBranchWrapper',
// 	// 	});
// };

// processBranchWrapper();
