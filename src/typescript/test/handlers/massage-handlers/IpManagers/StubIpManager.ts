import { workerData, parentPort } from 'worker_threads';
import { CountRequestsBatch } from '../../../../services/appointments-update/components/atomic-counter/ImplementCounters';
import {
	IpManagerHandlerData,
	IpManagerMessageHandler,
} from '../../../../concepts/workers/logic/IpManagerMessageHandler';
import path from 'path';
import { ContinuesUpdatePPort } from '../../../../services/appointments-update/components/custom-parent/ContinuesUpdatePPort';
import { NaturalNumbersCounterSetup } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';
import { VerifyDepletedMessage } from '../../../../services/appointments-update/components/atomic-counter/ResetOnDepleted';

const setup = () => {
	const apiRequestsPerMinute = 20;
	const apiRequestsPerHour = 40;
	const averageRequestsPerBranch = 8;

	if (!parentPort) throw Error('[Stub Appointments][setup] parentPort is null or undefined ');
	const continuesUpdatePort = new ContinuesUpdatePPort(parentPort);
	const proxyEndpoint = continuesUpdatePort.extractData(workerData);

	// Data for shared request counters.
	const requestCounterData = new NaturalNumbersCounterSetup({
		counterRange: { bottom: 0, top: apiRequestsPerMinute },
	});

	// Ip Manager's Counters.
	const countRequestsBatch = new CountRequestsBatch(apiRequestsPerHour, apiRequestsPerMinute);
	const verifyDepletedMessage = new VerifyDepletedMessage(requestCounterData);

	const ipManagerHandlerData: IpManagerHandlerData = {
		amountOfUpdaters: 3,
		apiRequestsPerHour,
		apiRequestsPerMinute,
		averageRequestsPerBranch,
		proxyEndpoint,
		thisWorkerID: 1,
		updaterScriptPath: path.join(__dirname, 'StubAppointments.js'),
	};
	const ipManagerMessageHandler = new IpManagerMessageHandler(ipManagerHandlerData);

	return {
		apiRequestsPerMinute,
		apiRequestsPerHour,
		continuesUpdatePort,
		countRequestsBatch,
		verifyDepletedMessage,
		ipManagerMessageHandler,
	};
};

const listen = async () => {
	const {
		ipManagerMessageHandler,
		countRequestsBatch,
		continuesUpdatePort,
		apiRequestsPerHour,
		apiRequestsPerMinute,
	} = setup();

	continuesUpdatePort.on('message', async (message) => {
		console.log('[Stub Ip Manager][listen][continuesUpdatePort] message : ', message);
		const response = await ipManagerMessageHandler.handle({
			message,
			parentPort: continuesUpdatePort,
		});
		if (typeof response === 'object') {
			for (const key in response) {
				response[key].on('message', (WorkerMessage) => {
					console.log(
						`[Stub Ip Manager][listen][continuesUpdatePort][Worker ${response[key].threadId}] message : `,
						WorkerMessage
					);
					ipManagerMessageHandler.handle({
						message: WorkerMessage,
						worker: response[key],
					});
				});
				response[key].postMessage({ handlerName: 'start-updates' });
			}
		}
	});
};

listen();
