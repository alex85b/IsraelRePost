import { workerData, parentPort } from 'worker_threads';
import {
	AppointmentsHandlerData,
	AppointmentsMessageHandler,
} from '../../../../concepts/workers/logic/AppointmentsMessageHandler';
import {
	APIRequestCounterData,
	CountRequestsBatch,
} from '../../../../services/appointments-update/components/atomic-counter/ImplementCounters';
import { IpManagerParentPort } from '../../../../concepts/ports/parent-ports/IpManagerParentPort';
import { NaturalNumbersCounterSetup } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';
import { VerifyDepletedMessage } from '../../../../services/appointments-update/components/atomic-counter/ResetOnDepleted';

const setup = () => {
	const requestsPerMinute = 20;
	const requestsPerHour = 40;

	if (!parentPort) throw Error('[Stub Appointments][setup] parentPort is null or undefined ');
	const ipManagerParentPort = new IpManagerParentPort(parentPort);
	// Data for shared request counters.
	const requestCounterData = new APIRequestCounterData(requestsPerMinute);

	// Ip Manager's Counters.
	const countRequestsBatch = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
	const verifyDepletedMessage = new VerifyDepletedMessage(
		new NaturalNumbersCounterSetup({ counterRange: { bottom: 0, top: requestsPerMinute } })
	);

	const appointmentsLogicData: AppointmentsHandlerData = {
		proxyEndpoint: undefined,
		counterData: requestCounterData,
		thisWorkerID: 1,
		parentPort: ipManagerParentPort,
	};
	const appointmentsMessageHandler = new AppointmentsMessageHandler(appointmentsLogicData);

	return {
		requestsPerMinute,
		requestsPerHour,
		ipManagerParentPort,
		countRequestsBatch,
		verifyDepletedMessage,
		appointmentsMessageHandler,
	};
};

const listen = async () => {
	const {
		appointmentsMessageHandler,
		countRequestsBatch,
		ipManagerParentPort,
		requestsPerHour,
		requestsPerMinute,
		verifyDepletedMessage,
	} = setup();

	ipManagerParentPort.on('message', async (message) => {
		console.log('[Stub Appointments][listen] message : ', message);
		appointmentsMessageHandler.handle({ message });
	});
};

listen();
