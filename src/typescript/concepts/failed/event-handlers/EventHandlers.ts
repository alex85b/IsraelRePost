// import {
// 	APIRequestCounterData,
// 	CountAPIRequest,
// 	CountRequestsBatch,
// } from '../../atomic-counter/ImplementCounters';
// import { IBUMessageHandlers } from '../../continues-update/BranchUpdater';
// import { CUMessageHandlers } from '../../continues-update/ContinuesUpdate';
// import { IMMessageHandlers } from '../../continues-update/IpManager';
// import { ACustomParentPort } from '../../custom-parent/ACustomParentPort';
// import { AbstractCustomWorker } from '../../custom-worker/AbstractCustomWorker';
// import { BranchModule } from '../../elastic/BranchModel';
// import { ErrorModule } from '../../elastic/ErrorModel';
// import { ProxyEndpoint } from '../../proxy-management/ProxyCollection';
// import { BranchesToProcess } from '../../redis/BranchesToProcess';

// // ###################################################################################################
// // ### Appointment Update ############################################################################
// // ###################################################################################################

// type AppointmentUpdateData = {
// 	'start-updates': {
// 		requestCounter: CountAPIRequest;
// 		branchesToProcess: BranchesToProcess;
// 		branchModule: BranchModule;
// 		errorModule: ErrorModule;
// 	};
// 	'stop-updates': {};
// 	'end-updater': {};
// 	'continue-updates': {
// 		requestCounter: CountAPIRequest;
// 		branchesToProcess: BranchesToProcess;
// 		branchModule: BranchModule;
// 		errorModule: ErrorModule;
// 	};
// };

// type AppointmentUpdateHandlerFunctions = {
// 	[K in keyof AppointmentUpdateData]: (
// 		data: AppointmentUpdateData[K]
// 	) => IMMessageHandlers | boolean | void;
// };

// export class AppointmentUpdateHandler {
// 	private stringFunctionMap: AppointmentUpdateHandlerFunctions = {
// 		'start-updates': this.startUpdates.bind(this),
// 		'stop-updates': this.stopUpdates.bind(this),
// 		'end-updater': this.endUpdater.bind(this),
// 		'continue-updates': this.continueUpdates.bind(this),
// 	};

// 	// Example functions with specific parameters
// 	startUpdates({
// 		branchModule,
// 		branchesToProcess,
// 		errorModule,
// 		requestCounter,
// 	}: AppointmentUpdateData['start-updates']): IMMessageHandlers {
// 		// Updater Depleted During Update.
// 		return 'updater-depleted';
// 	}

// 	stopUpdates(data: AppointmentUpdateData['stop-updates']) {
// 		return true;
// 	}

// 	endUpdater(data: AppointmentUpdateData['end-updater']) {
// 		return true;
// 	}

// 	continueUpdates(data: AppointmentUpdateData['continue-updates']): IMMessageHandlers {
// 		return 'updater-done';
// 	}

// 	handleEvent<T extends keyof AppointmentUpdateData>(
// 		functionName: T,
// 		data: AppointmentUpdateData[T]
// 	) {
// 		const handler = this.stringFunctionMap[functionName];
// 		if (handler !== undefined) {
// 			handler(data);
// 		} else {
// 			throw Error(
// 				`[Appointment Update Handler] No function found for the input string: ${functionName}`
// 			);
// 		}
// 	}
// }

// // ###################################################################################################
// // ### Continues Updates #############################################################################
// // ###################################################################################################

// type ContinuesUpdatesData = {
// 	'manager-depleted': {
// 		customWorker: AbstractCustomWorker<IMMessageHandlers, CUMessageHandlers>;
// 	};
// 	'manager-done': {
// 		customWorker: AbstractCustomWorker<IMMessageHandlers, CUMessageHandlers>;
// 	};
// 	online: {
// 		customWorker: AbstractCustomWorker<IMMessageHandlers, CUMessageHandlers>;
// 	};
// 	error: {
// 		error: Error;
// 		threadID: number;
// 	};
// 	exit: {
// 		exitCode: number;
// 		threadID: number;
// 	};
// };

// type ContinuesUpdatesFunctions = {
// 	[K in keyof ContinuesUpdatesData]: (
// 		data: ContinuesUpdatesData[K]
// 	) => IMMessageHandlers | boolean | void;
// };

// export class ContinuesUpdatesHandler {
// 	private stringFunctionMap: ContinuesUpdatesFunctions = {
// 		'manager-depleted': this.hManagerDepleted.bind(this),
// 		'manager-done': this.hManagerDone.bind(this),
// 		online: this.hManagerOnline.bind(this),
// 		error: this.hManagerError.bind(this),
// 		exit: this.hManagerExit.bind(this),
// 	};

// 	hManagerDepleted({ customWorker }: ContinuesUpdatesData['manager-depleted']) {
// 		if (!customWorker) {
// 			throw Error(
// 				'[Continues Updates Handler][manager-depleted] handler: worker was not provided'
// 			);
// 		}
// 		customWorker.postMessage({ handlerName: 'stop-endpoint' });
// 		console.log(
// 			`Continues Update noticed Ip Manager ${
// 				customWorker.threadId ?? 'Unknown'
// 			} consumed 300 requests`
// 		);
// 	}

// 	hManagerDone({ customWorker }: ContinuesUpdatesData['manager-done']) {
// 		if (!customWorker) {
// 			throw Error(
// 				'[Continues Updates Handler][manager-done] handler: worker was not provided'
// 			);
// 		}
// 		customWorker.postMessage({ handlerName: 'stop-endpoint' });
// 		console.log(
// 			`Continues Update noticed Ip Manager ${
// 				customWorker.threadId ?? 'Unknown'
// 			} has no more branches to update`
// 		);
// 	}

// 	hManagerOnline({ customWorker }: ContinuesUpdatesData['online']) {
// 		if (!customWorker) {
// 			throw Error('[Continues Updates Handler][online] handler: worker was not provided');
// 		}
// 		console.log(
// 			`Continues Update noticed Ip Manager ${customWorker.threadId ?? 'Unknown'} is online`
// 		);
// 		customWorker.postMessage({
// 			handlerName: 'start-endpoint',
// 		});
// 	}

// 	hManagerError({ error, threadID }: ContinuesUpdatesData['error']) {
// 		console.log(
// 			`Continues Update noticed Ip Manager ${threadID ?? 'Unknown'} had error: `,
// 			error
// 		);
// 	}

// 	hManagerExit({ exitCode, threadID }: ContinuesUpdatesData['exit']) {
// 		console.log(
// 			`Continues Update noticed Ip Manager ${
// 				threadID ?? 'Unknown'
// 			} has exited with code ${exitCode}`
// 		);
// 	}

// 	handleEvent<T extends keyof ContinuesUpdatesData>(
// 		functionName: T,
// 		data: ContinuesUpdatesData[T]
// 	) {
// 		const handler = this.stringFunctionMap[functionName];
// 		if (handler !== undefined) {
// 			handler(data);
// 		} else {
// 			throw Error(
// 				`[Continues Updates Handler] No function found for the input string: ${functionName}`
// 			);
// 		}
// 	}
// }

// // ###################################################################################################
// // ### Ip Manager ####################################################################################
// // ###################################################################################################

// type IpManagerData = {
// 	'start-endpoint': {
// 		countRequestsBatch: CountRequestsBatch;
// 		thisThreadId: number;
// 		proxyEndpoint: ProxyEndpoint;
// 		amountOfUpdaters: number;
// 	};
// 	'stop-endpoint': {};
// 	'updater-done': {};
// 	'updater-depleted': {};
// };

// type IpManagerFunctions = {
// 	[K in keyof IpManagerData]: (
// 		data: IpManagerData[K]
// 	) => CUMessageHandlers | IBUMessageHandlers | boolean | void;
// };

// export class IpManagerHandler {
// 	private stringFunctionMap: IpManagerFunctions = {
// 		'start-endpoint': this.hStartEndpoint.bind(this),
// 		'stop-endpoint': this.hStopEndpoint.bind(this),
// 		'updater-done': this.hUpdaterDone.bind(this),
// 		'updater-depleted': this.hUpdaterDepleted.bind(this),
// 	};

// 	hStartEndpoint({
// 		countRequestsBatch,
// 		thisThreadId,
// 		proxyEndpoint,
// 		amountOfUpdaters,
// 	}: IpManagerData['start-endpoint']) {
// 		if (!countRequestsBatch) {
// 			throw Error(
// 				`[Ip Manager ${
// 					thisThreadId ?? 'Unknown'
// 				} Handler][start-endpoint] handler: received no${
// 					countRequestsBatch ? '' : ' countRequestsBatch'
// 				}`
// 			);
// 		}

// 		// Count the first batch of requests.
// 		const countResponse = countRequestsBatch.countConsumedRequests();
// 		if (countResponse.status === 'stopped') {
// 			console.error(countResponse);
// 			throw Error(
// 				`[Ip Manager: ${thisThreadId} Handler][start-endpoint] cannot count first batch of requests`
// 			);
// 		}

// 		if (proxyEndpoint) {
// 			console.log(`#Ip Manager ${thisThreadId ?? 'Unknown'} received an endpoint`);
// 		} else {
// 			console.log(`#Ip Manager ${thisThreadId ?? 'Unknown'} received no endpoint`);
// 		}
// 		for (let index = 0; index < amountOfUpdaters; index++) {
// 			// this.addUpdater(requestCounterData, endpoint);
// 		}
// 	}

// 	hStopEndpoint(data: IpManagerData['stop-endpoint']) {}
// 	hUpdaterDone(data: IpManagerData['updater-done']) {}
// 	hUpdaterDepleted(data: IpManagerData['updater-depleted']) {}

// 	handleEvent<T extends keyof IpManagerData>(functionName: T, data: IpManagerData[T]) {
// 		const handler = this.stringFunctionMap[functionName];
// 		if (handler !== undefined) {
// 			handler(data);
// 		} else {
// 			throw Error(
// 				`[Ip Manager Handler] No function found for the input string: ${functionName}`
// 			);
// 		}
// 	}
// }
