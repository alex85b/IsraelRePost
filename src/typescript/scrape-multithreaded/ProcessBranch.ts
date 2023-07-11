// import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
// import { ITimeSlotsDocument } from '../interfaces/ITimeSlotsDocument';
// import { getDatesOfServiceOfBranch } from './GetDatesOfServiceOfBranch';
// import { getServicesOfBranch } from './GetServicesOfBranch';
// import { getTimesOfDateOfServiceOfBranch } from './GetTimesOfDateServiceBranch';
// import { spinNewUser } from './SpinNewUser';
// import { Worker, workerData, parentPort } from 'worker_threads';
// import { getSharedData, setSharedData } from './SharedData';
// import { NotProvided } from '../errors/NotProvided';

// const processBranch = async () => {
// 	//
// 	//* /////////////////////////////////////////////////////
// 	//* Extract worker data ////////////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	const { branch, proxyAuth, proxyUrl, useProxy, timeout } = workerData as {
// 		branch: ISingleBranchQueryResponse;
// 		useProxy: boolean;
// 		proxyUrl: string;
// 		proxyAuth: { username: string; password: string };
// 		timeout: number;
// 	};

// 	//* /////////////////////////////////////////////////////
// 	//* Type guard /////////////////////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	if (!branch._id || !branch._index || !branch._source) {
// 		throw new NotProvided({
// 			message: 'workerData provided invalid branch',
// 			source: 'processBranch',
// 		});
// 	}

// 	if (useProxy) {
// 		if (!proxyUrl || typeof proxyUrl !== 'string' || proxyUrl.length === 0) {
// 			console.error('[processBranch] [proxyUrl] Error: ', proxyUrl);

// 			throw new NotProvided({
// 				message: 'workerData provided invalid proxyUrl',
// 				source: 'processBranch',
// 			});
// 		}
// 		if (
// 			!proxyAuth ||
// 			!proxyAuth.password ||
// 			!proxyAuth.username ||
// 			typeof proxyAuth.password !== 'string' ||
// 			typeof proxyAuth.username !== 'string' ||
// 			proxyAuth.password.length === 0 ||
// 			proxyAuth.username.length === 0
// 		) {
// 			console.error('[processBranch] [proxyAuth] Error: ', proxyAuth);
// 			throw new NotProvided({
// 				message: 'workerData provided invalid proxyAuth object',
// 				source: 'processBranch',
// 			});
// 		}
// 	}

// 	if (!timeout || typeof timeout !== 'number') {
// 		throw new NotProvided({
// 			message: 'workerData provided invalid timeout',
// 			source: 'processBranch',
// 		});
// 	}

// 	// setTimeout(() => {
// 	// 	console.log('Function execution timed out');
// 	// 	throw new Error(`Execution timed out after ${timeout}`); // Throw an error to abort execution
// 	// }, timeout);

// 	//* /////////////////////////////////////////////////////
// 	//* Initialization /////////////////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	const branchNumber = branch._source.branchnumber;
// 	const branchKey = branch._id;
// 	const qnomy = branch._source.qnomycode;
// 	const branchName = branch._source.branchnameEN;
// 	console.log(`[Start] branch: ${branchName} ${branchNumber}`);
// 	const branchServicesDatesTimes: ITimeSlotsDocument[] = [];

// 	//* /////////////////////////////////////////////////////
// 	//* Create new anonymous user //////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	const userResponse = await spinNewUser(useProxy, proxyUrl, proxyAuth);

// 	//* /////////////////////////////////////////////////////
// 	//* Get services ///////////////////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	const services = await getServicesOfBranch(
// 		{
// 			ARRAffinity: userResponse.cookies.ARRAffinity,
// 			ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
// 			CentralJWTCookie: userResponse.cookies.CentralJWTCookie,
// 			GCLB: userResponse.cookies.GCLB,
// 		},
// 		{ locationId: String(qnomy), serviceTypeId: '0' },
// 		{ token: userResponse.data.token },
// 		useProxy,
// 		proxyUrl,
// 		proxyAuth
// 	);

// 	//* /////////////////////////////////////////////////////
// 	//* Get dates per service //////////////////////////////
// 	//* ///////////////////////////////////////////////////
// 	for (const service of services) {
// 		const dates = await getDatesOfServiceOfBranch(
// 			{
// 				ARRAffinity: userResponse.cookies.ARRAffinity,
// 				ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
// 				GCLB: userResponse.cookies.GCLB,
// 			},
// 			{ serviceId: service.serviceId, startDate: '' },
// 			{ token: userResponse.data.token },
// 			useProxy,
// 			proxyUrl,
// 			proxyAuth
// 		);

// 		//* /////////////////////////////////////////////////////
// 		//* Get times per date /////////////////////////////////
// 		//* ///////////////////////////////////////////////////
// 		for (const date of dates) {
// 			const times = await getTimesOfDateOfServiceOfBranch(
// 				{
// 					ARRAffinity: userResponse.cookies.ARRAffinity,
// 					ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
// 					GCLB: userResponse.cookies.GCLB,
// 				},
// 				{
// 					CalendarId: date.calendarId,
// 					dayPart: '0',
// 					ServiceId: service.serviceId,
// 				},
// 				{ token: userResponse.data.token },
// 				useProxy,
// 				proxyUrl,
// 				proxyAuth
// 			);
// 			//* /////////////////////////////////////////////////////
// 			// TODO:Write document /////////////////////////////////
// 			//* ///////////////////////////////////////////////////
// 			branchServicesDatesTimes.push({
// 				branchKey: branchKey,
// 				branchServiceId: Number.parseInt(service.serviceId),
// 				branchServiceName: service.serviceName,
// 				branchDate: date.calendarDate,
// 				timeSlots: times.map((time) => {
// 					return { Time: Number.parseInt(time.Time) };
// 				}),
// 			});
// 		}
// 	}
// 	parentPort?.postMessage(branchServicesDatesTimes);
// };

// processBranch();

// // module.exports = processBranch;

// // const processBranchTest = async (
// // 	req: Request,
// // 	res: Response,
// // 	next: NextFunction
// // ) => {
// // 	try {
// // 		//
// // 		// Get a path to Elasticsearch certificates.
// // 		const certificatePath = path.join(
// // 			__dirname,
// // 			'..',
// // 			'..',
// // 			'..',
// // 			'elastic-cert',
// // 			'http_ca.crt'
// // 		);

// // 		// Read the Certificates file.
// // 		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

// // 		// Query Elasticsearch to get all the branches.
// // 		const { allBranches } = await queryAllBranches(certificateContents);
// // 		const branch = allBranches[10];
// // 		const qnomycode = branch._source.qnomycode;

// // 		const proxyConfig = {
// // 			proxyAuth: {
// // 				password: process.env.PROX_PAS || '',
// // 				username: process.env.PROX_USR || '',
// // 			},
// // 			proxyUrl: (process.env.PROX_ENDP || '') + (process.env.PROX_SPORT || ''),
// // 			useProxy: false,
// // 		};

// // 		const userConfigBuilder = new UserCreateConfig(proxyConfig);

// // 		const parsedCreateResponse = parseUserCreateResponse(
// // 			await generateResponse<UserCreateConfig, IUserCreateResult>(
// // 				userConfigBuilder,
// // 				15000
// // 			)
// // 		);

// // 		const commonConfigInput = {
// // 			...parsedCreateResponse,
// // 			proxyAuth: proxyConfig.proxyAuth,
// // 			proxyUrl: proxyConfig.proxyUrl,
// // 			useProxy: proxyConfig.useProxy,
// // 		};

// // 		const servicesConfigBuilder = new GetServicesConfig({
// // 			...commonConfigInput,
// // 			url: { locationId: String(branch._source.qnomycode), serviceTypeId: '0' },
// // 		});

// // 		const parsedServicesResponse = parseGetServicesResponse(
// // 			await generateResponse<GetServicesConfig, IGetServicesResult>(
// // 				servicesConfigBuilder,
// // 				15000
// // 			)
// // 		).Results;

// // 		// Pretend there is a 'for' that iterate 'Services'.
// // 		const { serviceId, ServiceTypeId } = parsedServicesResponse[0];

// // 		const searchDatesBuilder = new SearchDatesConfig({
// // 			...commonConfigInput,
// // 			url: { serviceId: String(serviceId), serviceTypeId: String(ServiceTypeId) },
// // 		});

// // 		const parsedDatesResponse = parseSearchDatesResponse(
// // 			await generateResponse<SearchDatesConfig, ISearchDatesResult>(
// // 				searchDatesBuilder,
// // 				15000
// // 			)
// // 		).Results;

// // 		// Pretend there is a 'for' that iterate 'Dates'.
// // 		const { calendarId } = parsedDatesResponse[0];

// // 		const searchTimesBuilder = new SearchTimesConfig({
// // 			...commonConfigInput,
// // 			url: {
// // 				CalendarId: String(calendarId),
// // 				ServiceId: String(serviceId),
// // 				dayPart: '0',
// // 			},
// // 		});

// // 		const parsedTimesResponse = parseSearchTimesResponse(
// // 			await generateResponse<SearchTimesConfig, ISearchTimesResult>(
// // 				searchTimesBuilder,
// // 				15000
// // 			)
// // 		);

// // 		res.status(200).send(parsedTimesResponse);
// // 	} catch (error) {
// // 		res.status(500).send({ Error: error });
// // 	}
// // };
