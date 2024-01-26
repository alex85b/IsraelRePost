import {
	AppointmentsHandlerData,
	AppointmentsMessageHandlers,
	AppointmentsMessageHandler,
} from '../../../concepts/workers/logic/AppointmentsMessageHandler';
import {
	APIRequestCounterData,
	CountRequestsBatch,
	VerifyDepletedMessage,
} from '../../../services/appointments-update/components/atomic-counter/ImplementCounters';
import { IMessage } from '../../../services/appointments-update/worker-messaging/HandleThreadMessages';

export const TestAppointmentsWorkerLogic = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Appointments Worker Logic] Start');

	// How many requests should be held in reserve.
	const safetyMargin = 2;

	// Total Requests that can be made pen hour Minus a safety margin.
	const requestsPerHour = 300 - safetyMargin; // 298

	/*
	The total amount of requests that can be made in one minute,
	This will be used as a batch,
	The next batch will be delivered after a minute after the last request is 'Consumed',
	Meaning after the counter drops to 0.
	*/
	const requestsPerMinute = 50 - safetyMargin; // 48

	// An estimation of how much requests an update branch-appointments should consume.
	const avgRequestsPerBranch = 8; // TODO: For each branch, Fetch this data instead of relaying on avg.

	// Data for shared request counters.
	const requestCounterData = new APIRequestCounterData(requestsPerMinute);

	// Ip Manager's Counters.
	const countRequestsBatch = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
	const verifyDepletedMessage = new VerifyDepletedMessage(requestCounterData);

	const appointmentsLogicData: AppointmentsHandlerData = {
		proxyEndpoint: undefined,
		counterData: requestCounterData,
		thisWorkerID: 1,
	};

	console.log(
		'[Test Appointments Worker Logic] Setup an AppointmentsLogicData : ',
		appointmentsLogicData
	);

	const appointmentsWorkerLogic = new AppointmentsMessageHandler(appointmentsLogicData);
	console.log('[Test Appointments Worker Logic] Constructed an appointmentsWorkerLogic');

	const startMessage: IMessage<AppointmentsMessageHandlers> = {
		handlerName: 'start-updates',
	};

	const stopMessage: IMessage<AppointmentsMessageHandlers> = {
		handlerName: 'stop-updates',
	};

	const endMessage: IMessage<AppointmentsMessageHandlers> = {
		handlerName: 'end-updater',
	};

	const continueMessage: IMessage<AppointmentsMessageHandlers> = {
		handlerName: 'continue-updates',
	};

	let promisedResponse = appointmentsWorkerLogic.handle({ message: startMessage }) ?? 'void';
	(await appointmentsWorkerLogic.handle({ message: stopMessage })) ?? 'void';
	let response = await promisedResponse;
	response = (await appointmentsWorkerLogic.handle({ message: continueMessage })) ?? 'void';

	console.log(
		'[Test Appointments Worker Logic] appointmentsWorkerLogic hStartUpdates - response : ',
		response
	);

	if (response === 'updater-depleted') {
		verifyDepletedMessage.isValidDepleted;
		console.log(
			'[Test Appointments Worker Logic] isValidDepleted : ',
			verifyDepletedMessage.isValidDepleted()
		);
		verifyDepletedMessage.resetRequestCounter(2);
		console.log('[Test Appointments Worker Logic] resetRequestCounter(2)');
		appointmentsWorkerLogic.handle({ message: { handlerName: 'continue-updates' } });
	}

	console.log('[Test Appointments Worker Logic] End');
};
