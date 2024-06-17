import {
	ITrackDepletedClaims,
	DepletedClaimsTracker,
} from '../../../../../services/updateAppointments/helpers/claimsTracker/DepletedClaimTracker';
import path from 'path';
import { WorkerWrapper } from '../../../../../services/updateAppointments/helpers/threadCommunication/CommunicationWrappers';
import {
	ThreadMessage,
	AppointmentsUpdatingMessages,
} from '../../../../../services/updateAppointments/helpers/threadCommunication/Messages';

console.log('** Test Depleted Claim Tracker **');

export const testSingleThreadedDepletedTracker = async () => {
	console.log('** (1) Test Depleted Claim Tracker | Test Single Threaded Depleted Tracker **');
	const depletedTracker: ITrackDepletedClaims = new DepletedClaimsTracker();

	console.log(
		'[testSingleThreadedDepletedTracker] depletedTracker : ',
		JSON.stringify(depletedTracker.track(), null, 4)
	);

	console.log(
		'[testSingleThreadedDepletedTracker] depletedTracker : ',
		JSON.stringify(depletedTracker.track(), null, 4)
	);

	console.log(
		'[testSingleThreadedDepletedTracker] depletedTracker : ',
		JSON.stringify(depletedTracker.track(), null, 4)
	);
};

export const testMultiThreadedDepletedTracker = async () => {
	console.log('** (2) Test Depleted Claim Tracker | Test Multi Threaded Depleted Tracker **');
	const depletedTracker: ITrackDepletedClaims = new DepletedClaimsTracker();

	for (let i = 0; i < 3; i++) {
		// Create a dummy worker for testing.
		const communicationWrapper = new WorkerWrapper({
			workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		});
		communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				console.log(
					`[testHandleStartUpdateUseProxy] From ${communicationWrapper.getID()} Incoming Message : `,
					message
				);
				console.log(
					'[testSingleThreadedDepletedTracker] depletedTracker : ',
					JSON.stringify(depletedTracker.track(), null, 4)
				);
			},

			onErrorCallback(error) {
				console.log('[testHandleStartUpdateUseProxy] Error : ', error.message);
			},

			onExitCallback(exitCode) {
				console.log('[testHandleStartUpdateUseProxy] Exit Code : ', exitCode);
			},
		});
	}
};
