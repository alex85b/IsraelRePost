import { parentPort, workerData } from 'worker_threads';
import { IpManagerParentPort } from '../../../../concepts/ports/parent-ports/IpManagerParentPort';
import {
	AppointmentsHandlerData,
	AppointmentsMessageHandler,
} from '../../../../concepts/workers/logic/AppointmentsMessageHandler';
import { LimitPerMinute } from '../../../../services/appointments-update/components/request-regulator/LimitRequests';
import { NaturalNumbersArraySetup } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';

const setup = () => {
	if (!parentPort) throw Error('[Stub Appointments][setup] parentPort is null or undefined ');
	const ipManagerParentPort = new IpManagerParentPort(parentPort);
	const { proxyEndpoint, CounterData } = ipManagerParentPort.extractData(workerData);

	console.log('[Stub Appointments][setup] proxyEndpoint : ', proxyEndpoint);
	console.log('[Stub Appointments][setup] counterSetup : ', CounterData);

	const appointmentsLogicData: AppointmentsHandlerData = {
		proxyEndpoint: undefined,
		requestLimiter: new LimitPerMinute(
			new NaturalNumbersArraySetup({ readyData: CounterData })
		),
		thisWorkerID: 1,
		parentPort: ipManagerParentPort,
	};

	const appointmentsMessageHandler = new AppointmentsMessageHandler(appointmentsLogicData);

	return {
		ipManagerParentPort,
		proxyEndpoint,
		appointmentsMessageHandler,
	};
};

const listen = async () => {
	const { ipManagerParentPort, proxyEndpoint, appointmentsMessageHandler } = setup();
	console.log('[StubAppointments][listen] setup() performed');

	ipManagerParentPort.on('message', async (message) => {
		console.log('[Stub Appointments][listen] message : ', message);
		appointmentsMessageHandler.handle({ message });
	});
};

listen();
