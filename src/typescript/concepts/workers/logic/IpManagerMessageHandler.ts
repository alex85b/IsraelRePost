import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
import {
	ICounterSetup,
	NaturalNumbersCounterSetup,
} from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
import { ResetLimitPerMinute } from '../../../services/appointments-update/components/request-regulator/ResetRequestLimiter';

import { CUMessageHandlers } from '../../../services/appointments-update/entry-point/ContinuesUpdateRoot';
import { AppointmentsUpdaterWorker } from '../../ports/worker-ports/AppointmentsUpdaterWorker';
import {
	HandlerFunction,
	HandlerFunctionCollection,
	MessagesHandler,
} from '../messaging/WorkerMessages';
import { AppointmentsMessageHandlers } from './AppointmentsMessageHandler';

// ################################################################################################
// ### Class ######################################################################################
// ################################################################################################

export class IpManagerMessageHandler extends MessagesHandler<
	IpManagerMessageHandlers,
	AppointmentsMessageHandlers | CUMessageHandlers
> {
	protected functionCollection: HandlerFunctionCollection<
		IpManagerMessageHandlers,
		AppointmentsMessageHandlers | CUMessageHandlers
	> = {
		'start-endpoint': undefined,
		'stop-endpoint': undefined,
		'updater-depleted': undefined,
		'updater-done': undefined,
	};

	private appointmentsUpdatersObject: AppointmentsUpdatersObject = {};
	private releaseQueue: AppointmentsUpdaterWorker[] = [];
	// private apiRequestCounterData; // = new APIRequestCounterData(requestsPerMinute);
	// private countRequestsBatch; // = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
	// private verifyDepletedMessage; // = new VerifyDepletedMessage(requestCounterData);
	private amountOfUpdaters;
	private averageRequestsPerBranch;
	private proxyEndpoint;
	private thisWorkerID;
	private updaterScriptPath;
	private apiRequestsPerMinute;

	constructor({
		amountOfUpdaters,
		apiRequestsPerHour,
		apiRequestsPerMinute,
		averageRequestsPerBranch,
		proxyEndpoint,
		thisWorkerID,
		updaterScriptPath,
	}: IpManagerHandlerData) {
		super();
		// New:
		const requestCounterSetup: ICounterSetup = new NaturalNumbersCounterSetup({
			counterRange: { bottom: 0, top: apiRequestsPerMinute + 51 },
		});

		// this.apiRequestCounterData = new APIRequestCounterData(apiRequestsPerMinute);
		// this.countRequestsBatch = new CountRequestsBatch(apiRequestsPerHour, apiRequestsPerMinute);
		// this.verifyDepletedMessage = new ResetLimitPerMinute(requestCounterSetup);
		this.amountOfUpdaters = amountOfUpdaters;
		this.averageRequestsPerBranch = averageRequestsPerBranch;
		this.setupMessageHandlers();
		this.proxyEndpoint = proxyEndpoint;
		this.thisWorkerID = thisWorkerID;
		this.updaterScriptPath = updaterScriptPath;
		this.apiRequestsPerMinute = apiRequestsPerMinute;
	}

	// ################################
	// ### Message Handlers ###########
	// ################################

	// Handle 'start-endpoint'
	private hStartEndpoint: HandlerFunction<IpManagerMessageHandlers, never> = () => {
		// Count the first batch of requests.
		// const countResponse = this.countRequestsBatch.countConsumedRequests();
		// console.log(
		// 	`[Ip Manager Message Handler: ${this.thisWorkerID}][hStartUpdates] countResponse : `,
		// 	countResponse
		// );
		// if (countResponse.status === 'stopped') {
		// 	throw Error(
		// 		`[Ip Manager Message Handler: ${this.thisWorkerID}][hStartUpdates] cannot count first batch of requests`
		// 	);
		// }

		for (let index = 0; index < this.amountOfUpdaters; index++) {
			// const bUpdater = new AppointmentsUpdaterWorker(this.updaterScriptPath, {
			// 	workerData: {
			// 		proxyEndpoint: this.proxyEndpoint,
			// 		counterSetup: this.apiRequestCounterData
			// 	},
			// });
			// if (bUpdater.threadId !== undefined) {
			// 	this.appointmentsUpdatersObject[bUpdater.threadId] = bUpdater;
			// }
		}
		return Promise.resolve(this.appointmentsUpdatersObject);
	};

	private hStopEndpoint: HandlerFunction<IpManagerMessageHandlers, AppointmentsMessageHandlers> =
		() => {
			console.log(
				`[Ip Manager Message Handler: ${this.thisWorkerID}][hStopEndpoint] closing worker-thread`
			);
			for (let workerKey in this.appointmentsUpdatersObject) {
				this.appointmentsUpdatersObject[workerKey].postMessage({
					handlerName: 'end-updater',
				});
			}
		};

	private hUpdaterDone: HandlerFunction<IpManagerMessageHandlers, AppointmentsMessageHandlers> =
		({ worker }) => {
			if (!worker)
				throw Error(
					`[Ip Manager Message Handler: ${this.thisWorkerID}][hUpdaterDone] worker was not provided`
				);
			worker.postMessage({ handlerName: 'end-updater' });
		};

	private hUpdaterDepleted: HandlerFunction<
		IpManagerMessageHandlers,
		AppointmentsMessageHandlers
	> = ({ worker }) => {
		// Is 'depleted' message valid ?
		// const { isValidDepleted, isFirstDepleted, aboveRequestLimit } =
		// 	this.verifyDepletedMessage.isValidDepleted(this.apiRequestsPerMinute);
		// if (!worker)
		// 	throw Error(
		// 		`[Ip Manager Message Handler: ${this.thisWorkerID}][hUpdaterDepleted] worker was not provided`
		// 	);
		// // Not 'depleted' at all (request-batch is not depleted).
		// if (!aboveRequestLimit) {
		// 	// Signal to the branch-updater to continue (false alarm).
		// 	return Promise.resolve('continue-updates');
		// }
		// // Really 'depleted' but not the first.
		// if (aboveRequestLimit && !isFirstDepleted) {
		// 	// Add messageCallback to the release queue.
		// 	this.releaseQueue.push(worker);
		// 	// A continue-updates will be sent after reset.
		// }
		// Message is valid: Both valid 'depleted' and the first 'depleted'.
		// if (isValidDepleted) {
		// Add messageCallback to the release queue.
		// this.releaseQueue.push(worker);
		// Check if a new request batch can be created And LOCK
		// const { status, value } = this.countRequestsBatch.countConsumedRequests();
		// if (status === 'success') {
		// 	// A new request-batch can be prepared, perform delayed reset.
		// 	setTimeout(() => {
		// 		this.resetBatchAndCounters();
		// 	}, 61000);
		// } else {
		// 	// Cannot make new request-batch, maybe can make smaller batch.
		// 	if (value > 0) {
		// 		// A smaller request-batch can be made.
		// 		setTimeout(() => {
		// 			this.resetBatchAndCounters();
		// 		}, 61000);
		// 	}
		// 	// No more requests can be made from this endpoint.
		// 	// Close this thread and it's children.
		// 	for (let workerKey in this.appointmentsUpdatersObject) {
		// 		this.appointmentsUpdatersObject[workerKey].postMessage({
		// 			handlerName: 'end-updater',
		// 		});
		// 	}
		// }
		// }
	};

	// ################################
	// ### Helper Functions ###########
	// ################################

	private setupMessageHandlers() {
		this.addMessageHandler('start-endpoint', this.hStartEndpoint);
		this.addMessageHandler('stop-endpoint', this.hStopEndpoint);
		this.addMessageHandler('updater-depleted', this.hUpdaterDepleted);
		this.addMessageHandler('updater-done', this.hUpdaterDone);
	}

	private resetBatchAndCounters = () => {
		// Reset request-batch counter to batch-size.
		// This also blocks addition to 'releaseQueue'.
		// this.verifyDepletedMessage.resetRequestBatch();
		// // Reset first-depleted counter.
		// this.verifyDepletedMessage.resetDepletedFlag();
		// Return 'continue' message to all awaiting workers.
		this.releaseQueue.forEach((worker) =>
			worker.postMessage({ handlerName: 'continue-updates' })
		);
	};
}

// ################################################################################################
// ### Types ######################################################################################
// ################################################################################################

export type IpManagerHandlerData = {
	apiRequestsPerHour: number;
	apiRequestsPerMinute: number;
	averageRequestsPerBranch: number;
	amountOfUpdaters: number;
	proxyEndpoint: ProxyEndpoint | undefined;
	thisWorkerID: number;
	updaterScriptPath: string;
};

export type AppointmentsUpdatersObject = { [key: number]: AppointmentsUpdaterWorker };

export type IpManagerMessageHandlers =
	| 'start-endpoint'
	| 'stop-endpoint'
	| 'updater-done'
	| 'updater-depleted';
