// One of the functions of Appointment Message Handler is to send-back messages,
// To its parent - Ip Manager.
// This Test is written from a point of view of Ip Manager.

import { AppointmentsUpdaterWorker } from '../../../../concepts/ports/worker-ports/AppointmentsUpdaterWorker';
import { NaturalNumbersCounterSetup } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';
import {
	APIRequestCounterData,
	CountRequestsBatch,
} from '../../../../services/appointments-update/components/atomic-counter/ImplementCounters';
// import {} from '../Appointments/StubAppointments';

import path from 'path';
import { VerifyDepletedMessage } from '../../../../services/appointments-update/components/atomic-counter/ResetOnDepleted';

const setupData = () => {
	// How many requests should be held in reserve.
	const safetyMargin = 0;
	// Total Requests that can be made pen hour Minus a safety margin.
	const requestsPerHour = 30 - safetyMargin; // Should be 298
	/*
	The total amount of requests that can be made in one minute,
	This will be used as a batch,
	The next batch will be delivered after a minute after the last request is 'Consumed',
	Meaning after the counter drops to 0.
	*/
	const requestsPerMinute = 20 - safetyMargin; // Should be 48
	// An estimation of how much requests an update branch-appointments should consume.
	const avgRequestsPerBranch = 8; // TODO: For each branch, Fetch this data instead of relaying on avg.
	// Data for shared request counters.
	const requestCounterData = new APIRequestCounterData(requestsPerMinute);
	// Ip Manager's Counters.
	const countRequestsBatch = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
	const verifyDepletedMessage = new VerifyDepletedMessage(
		new NaturalNumbersCounterSetup({ counterRange: { bottom: 0, top: requestsPerMinute } })
	);

	return {
		safetyMargin,
		requestsPerHour,
		requestsPerMinute,
		avgRequestsPerBranch,
		requestCounterData,
		countRequestsBatch,
		verifyDepletedMessage,
	};
};

export const TestAppointments = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Appointments] Start');

	const {
		avgRequestsPerBranch,
		countRequestsBatch,
		requestCounterData,
		requestsPerHour,
		requestsPerMinute,
		safetyMargin,
		verifyDepletedMessage,
	} = setupData();

	let depletedRefreshFlag = true;

	// Setup an Appointments Stub.
	const appointmentsStub = new AppointmentsUpdaterWorker(
		path.join(__dirname, '..', 'Appointments', 'StubAppointments.js'),
		{ workerData: { counterData: requestCounterData, proxyEndpoint: undefined } }
	);

	appointmentsStub.on('message', (message) => {
		console.log('[TestAppointments] message : ', message);
		if (depletedRefreshFlag) {
			depletedRefreshFlag = false;
			verifyDepletedMessage.resetRequestCounter();
			appointmentsStub.postMessage({ handlerName: 'continue-updates' });
		} else {
			appointmentsStub.postMessage({ handlerName: 'end-updater' });
		}
	});
	appointmentsStub.on('online', () => {
		console.log('[TestAppointments] appointmentsStub is online');
		appointmentsStub.postMessage({ handlerName: 'start-updates' });
	});
	appointmentsStub.on('error', (error) => {
		console.log('[TestAppointments] error : ', error);
	});
	appointmentsStub.on('exit', (code) => {
		console.log('[TestAppointments] exit-code : ', code);
	});

	console.log('[Test Appointments] End');
};
