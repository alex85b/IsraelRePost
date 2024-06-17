// import { workerData, parentPort } from 'worker_threads';
// import {
// 	IpManagerHandlerData,
// 	IpManagerMessageHandler,
// } from '../../../../concepts/workers/logic/IpManagerMessageHandler';
// import path from 'path';
// import { ContinuesUpdatePPort } from '../../../../services/appointments-update/components/custom-parent/ContinuesUpdatePPort';
// import {
// 	NaturalNumbersArraySetup,
// 	NaturalNumbersCounterSetup,
// } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';
// import {
// 	IResetRequestLimiter,
// 	ResetLimitPerMinute,
// } from '../../../../services/appointments-update/components/request-regulator/ResetRequestLimiter';
// import {
// 	ILimitRequests,
// 	LimitPerMinute,
// } from '../../../../services/appointments-update/components/request-regulator/LimitRequests';
// import {
// 	ILimitRequestsBatch,
// 	LimitPerHour,
// } from '../../../../services/appointments-update/components/request-regulator/LimitRequestsBatch';

// const setup = () => {
// 	const apiRequestsPerMinute = 20;
// 	const apiRequestsPerHour = 40;
// 	const averageRequestsPerBranch = 8;

// 	if (!parentPort) throw Error('[Stub Appointments][setup] parentPort is null or undefined ');
// 	const continuesUpdatePort = new ContinuesUpdatePPort(parentPort);
// 	const proxyEndpoint = continuesUpdatePort.extractData(workerData);

// 	// Data for shared request counters.
// 	const requestCounterData = new NaturalNumbersCounterSetup({
// 		counterRange: { bottom: 0, top: apiRequestsPerMinute },
// 	});

// 	// Ip Manager's Limiters:

// 	// A Setup Class for Inner Counter that used inside limiter and reset-limiter
// 	const counterSetup = new NaturalNumbersArraySetup({
// 		counterRangeAndLength: { bottom: 0, length: 2, top: 255 },
// 	});

// 	// A Limiter of the requests that can be made in one minute.
// 	const requestLimiter: ILimitRequests = new LimitPerMinute(counterSetup);

// 	// A limiter of how many "per-minute" batches can be spawned in one hour.
// 	const batchLimiter: ILimitRequestsBatch = new LimitPerHour(
// 		apiRequestsPerHour,
// 		apiRequestsPerMinute
// 	);

// 	// Resets the Request-limiter.
// 	const limiterReset: IResetRequestLimiter = new ResetLimitPerMinute(counterSetup);

// 	const ipManagerHandlerData: IpManagerHandlerData = {
// 		amountOfUpdaters: 3,
// 		apiRequestsPerHour,
// 		apiRequestsPerMinute,
// 		averageRequestsPerBranch,
// 		proxyEndpoint,
// 		thisWorkerID: 1,
// 		updaterScriptPath: path.join(__dirname, 'StubAppointments.js'),
// 	};
// 	const ipManagerMessageHandler = new IpManagerMessageHandler(ipManagerHandlerData);

// 	return {
// 		apiRequestsPerMinute,
// 		apiRequestsPerHour,
// 		continuesUpdatePort,
// 		counterSetup,
// 		requestLimiter,
// 		batchLimiter,
// 		limiterReset,
// 		ipManagerMessageHandler,
// 	};
// };

// const listen = async () => {
// 	const {
// 		apiRequestsPerHour,
// 		apiRequestsPerMinute,
// 		batchLimiter,
// 		continuesUpdatePort,
// 		counterSetup,
// 		ipManagerMessageHandler,
// 		limiterReset,
// 		requestLimiter,
// 	} = setup();

// 	continuesUpdatePort.on('message', async (message) => {
// 		console.log('[Stub Ip Manager][listen][continuesUpdatePort] message : ', message);
// 		const response = await ipManagerMessageHandler.handle({
// 			message,
// 			parentPort: continuesUpdatePort,
// 		});
// 		if (typeof response === 'object') {
// 			for (const key in response) {
// 				response[key].on('message', (WorkerMessage) => {
// 					console.log(
// 						`[Stub Ip Manager][listen][continuesUpdatePort][Worker ${response[key].threadId}] message : `,
// 						WorkerMessage
// 					);
// 					ipManagerMessageHandler.handle({
// 						message: WorkerMessage,
// 						worker: response[key],
// 					});
// 				});
// 				response[key].postMessage({ handlerName: 'start-updates' });
// 			}
// 		}
// 	});
// };

// listen();
