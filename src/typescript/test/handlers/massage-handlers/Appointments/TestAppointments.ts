// One of the functions of Appointment Message Handler is to send-back messages,
// To its parent - Ip Manager.
// This Test is written from a "point of view" of Ip Manager.

import {
	IArrayCounterSetup,
	ICounterSetup,
	NaturalNumbersArraySetup,
	NaturalNumbersCounterSetup,
} from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';

import path from 'path';
import {
	IResetRequestLimiter,
	ResetLimitPerMinute,
} from '../../../../services/appointments-update/components/request-regulator/ResetRequestLimiter';
import {
	ILimitRequests,
	LimitPerMinute,
} from '../../../../services/appointments-update/components/request-regulator/LimitRequests';
import {
	ILimitRequestsBatch,
	LimitPerHour,
} from '../../../../services/appointments-update/components/request-regulator/LimitRequestsBatch';
import { AppointmentsUpdaterWorker } from '../../../../concepts/ports/worker-ports/AppointmentsUpdaterWorker';

const setupData = () => {
	/*
	Requests Limits*/
	const requestsPerHour = 60;
	const requestsPerMinute = 20;

	// Ip Manager's request regulators.
	const counterSetup = new NaturalNumbersArraySetup({
		counterRangeAndLength: { bottom: 0, length: 2, top: 0 },
	});
	const batchLimiter: ILimitRequestsBatch = new LimitPerHour(requestsPerHour, requestsPerMinute);
	const requestLimiter: ILimitRequests = new LimitPerMinute(counterSetup);
	console.log(
		'[Test Appointments][Setup Data] setRequestsLimit(requestsPerMinute) : ',
		requestLimiter.setRequestsLimit(requestsPerMinute)
	);
	const restOnDepleted: IResetRequestLimiter = new ResetLimitPerMinute(counterSetup);
	return {
		counterSetup,
		requestsPerHour,
		requestsPerMinute,
		batchLimiter,
		requestLimiter,
		restOnDepleted,
	};
};

export const TestAppointments = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Appointments] Start');

	const {
		counterSetup,
		requestsPerHour,
		requestsPerMinute,
		batchLimiter,
		requestLimiter,
		restOnDepleted,
	} = setupData();

	let depletedRefreshFlag = true;

	// Setup an Appointments Stub.
	const appointmentsStub = new AppointmentsUpdaterWorker(
		path.join(__dirname, '..', 'Appointments', 'StubAppointments.js'),
		{ workerData: { CounterData: counterSetup.getCounterData(), proxyEndpoint: undefined } }
	);

	appointmentsStub.on('message', (message) => {
		console.log('[TestAppointments] message : ', message);
		if (depletedRefreshFlag) {
			depletedRefreshFlag = false;
			restOnDepleted.resetRequestBatch();
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
