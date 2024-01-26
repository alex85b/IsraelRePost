import {
	RetrieveBranchServicesOptions,
	RetrieveBranchServices,
} from '../../../api/chain-requests/RetrieveBranchServices';
import {
	APIRequestCounterData,
	CountAPIRequest,
} from '../../../services/appointments-update/components/atomic-counter/ImplementCounters';
import { IMMessageHandlers } from '../../../services/appointments-update/worker-scripts/IpManagerWorkerScript';
import { BranchModule } from '../../../data/elastic/BranchModel';
import { ErrorModule } from '../../../data/elastic/ErrorModel';
import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
import { BranchesToProcess } from '../../../data/redis/BranchesToProcess';
import {
	HandlerData,
	HandlerFunction,
	HandlerFunctionCollection,
	MessagesHandler,
} from '../messaging/WorkerMessages';
import { IpManagerWorkerHandlers } from './IpManagerMessageHandler';

// ################################################################################################
// ### Class ######################################################################################
// ################################################################################################

export class AppointmentsMessageHandler extends MessagesHandler<
	AppointmentsMessageHandlers,
	IpManagerWorkerHandlers
> {
	private proxyEndpoint;
	private countRequests;
	private branchesToProcess = new BranchesToProcess();
	private retrieveBranchServices: BranchServicesObject;
	private elasticBranches;
	private elasticErrors;
	private thisWorkerID;
	private isStopped;

	protected functionCollection: HandlerFunctionCollection<
		AppointmentsMessageHandlers,
		IpManagerWorkerHandlers
	> = {
		'start-updates': undefined,
		'end-updater': undefined,
		'continue-updates': undefined,
		'stop-updates': undefined,
	};

	constructor({ counterData, proxyEndpoint, thisWorkerID }: AppointmentsHandlerData) {
		super();
		this.proxyEndpoint = proxyEndpoint;
		this.countRequests = new CountAPIRequest(counterData);
		this.elasticBranches = new BranchModule();
		this.elasticErrors = new ErrorModule();
		this.thisWorkerID = thisWorkerID;
		this.isStopped = false;
		this.retrieveBranchServices = { object: undefined, status: 'Not-Initialized' };

		if (!this.branchesToProcess || !this.countRequests) {
			throw Error(
				`[Appointments Message Handler: ${this.thisWorkerID}][constructor] received no${
					this.branchesToProcess ? '' : ' branchesToProcess'
				}${this.countRequests ? '' : ' requestCounter'}`
			);
		}

		this.setupMessageHandlers();
	}

	// ################################
	// ### message handlers ###########
	// ################################

	private hStartUpdates: HandlerFunction<AppointmentsMessageHandlers, IMMessageHandlers> =
		async () => {
			while (!this.isStopped) {
				const updateResult = await this.performAppointmentsUpdate({
					retrieveBranchServices: this.retrieveBranchServices,
					branchesToProcess: this.branchesToProcess,
					requestCounter: this.countRequests,
					thisWorkerID: this.thisWorkerID,
					elasticBranches: this.elasticBranches,
					elasticErrors: this.elasticErrors,
					proxyEndpoint: this.proxyEndpoint,
				});

				switch (updateResult) {
					case 'next-branch':
						console.log(
							`[Appointments Message Handler: ${this.thisWorkerID}][hStartUpdates] updateResult : `,
							updateResult
						);
						break;
					case 'updater-depleted':
					case 'updater-done':
					default:
						return updateResult;
				}
			}
		};

	private hContinueUpdates: HandlerFunction<AppointmentsMessageHandlers, IMMessageHandlers> =
		async () => {
			this.isStopped = false;
			while (!this.isStopped) {
				const updateResult = await this.performAppointmentsUpdate({
					retrieveBranchServices: this.retrieveBranchServices,
					branchesToProcess: this.branchesToProcess,
					requestCounter: this.countRequests,
					thisWorkerID: this.thisWorkerID,
					elasticBranches: this.elasticBranches,
					elasticErrors: this.elasticErrors,
					proxyEndpoint: this.proxyEndpoint,
				});

				switch (updateResult) {
					case 'next-branch':
						console.log(
							`[Appointments Message Handler: ${this.thisWorkerID}][hContinueUpdates] updateResult : `,
							updateResult
						);
						break;
					case 'updater-depleted':
					case 'updater-done':
					default:
						return updateResult;
				}
			}
		};

	private hEndUpdater: HandlerFunction<AppointmentsMessageHandlers, IMMessageHandlers> = () => {
		console.log(
			`[Appointments Message Handler: ${this.thisWorkerID}][hEndUpdater] hEndUpdater`
		);
		process.exit(0);
	};

	private hStopUpdater: HandlerFunction<AppointmentsMessageHandlers, IMMessageHandlers> = () => {
		console.log(
			`[Appointments Message Handler: ${this.thisWorkerID}][hStopUpdater] hStopUpdater`
		);
		this.isStopped = true;
	};

	// ################################
	// ### Helper Functions ###########
	// ################################

	private setupMessageHandlers() {
		this.addMessageHandler('start-updates', this.hStartUpdates);
		this.addMessageHandler('continue-updates', this.hContinueUpdates);
		this.addMessageHandler('end-updater', this.hEndUpdater);
		this.addMessageHandler('stop-updates', this.hStopUpdater);
	}

	private async performAppointmentsUpdate({
		branchesToProcess,
		requestCounter,
		retrieveBranchServices,
		thisWorkerID,
		elasticBranches,
		elasticErrors,
		proxyEndpoint,
	}: PerformUpdateData) {
		if (retrieveBranchServices.object === undefined) {
			// A brand new update - Fetch a Branch data, to perform appointments update.
			const updateBranch = await branchesToProcess.dequeueBranch();
			if (!updateBranch) return 'updater-done'; // No more branches.
			const { branchId, qnomycode } = updateBranch;
			console.log(
				`[Appointments Message Handler: ${thisWorkerID}][perform Appointments Update] branchId: ${branchId}`
			);

			// Construct BranchAppointments (data then class).
			const branchAppointmentOptions: RetrieveBranchServicesOptions = {
				branchCodePair: { branchId, qnomycode },
				requestCounter,
				proxyEndpoint,
			};
			retrieveBranchServices.object = new RetrieveBranchServices(branchAppointmentOptions);
		} else {
			console.log(
				`[Appointments Message Handler: ${thisWorkerID}][perform Appointments Update] Continuing Services Retrieval: `,
				retrieveBranchServices.object.getBranchData()
			);
		}
		// Perform an Update of branch's appointments and \ or errors.
		const status = await retrieveBranchServices.object.performUpdate();
		console.log(
			`[Appointments Message Handler: ${thisWorkerID}][perform Appointments Update] status: ${status}`
		);
		let validResponse: IMMessageHandlers | undefined;
		switch (status) {
			case 'Depleted':
				retrieveBranchServices.status = 'Depleted';
				validResponse = 'updater-depleted';
				return validResponse;
			case 'Done':
				// Write updated-appointment to Database (Currently Elastic).
				retrieveBranchServices.object.getUpdatedAppointments();
				const updateResponse = await elasticBranches.updateBranchServices(
					retrieveBranchServices.object.getBranchData().branchId,
					retrieveBranchServices.object.getUpdatedAppointments()
				);
				retrieveBranchServices.object = undefined;
				retrieveBranchServices.status = 'Done';
				return 'next-branch';
			case 'Error':
				// Write update-errors to Database (Currently Elastic).
				const errorResponse = await elasticErrors.updateAddError(
					retrieveBranchServices.object.getUpdateErrors(),
					Number(retrieveBranchServices.object.getBranchData().branchId)
				);
				retrieveBranchServices.object = undefined;
				retrieveBranchServices.status = 'Errored';
				return 'next-branch';
		}
	}

	// ################################
	// ### Class behavior #############
	// ################################

	// inherited from super().
}

// ################################################################################################
// ### Types ######################################################################################
// ################################################################################################

export type AppointmentsHandlerData = {
	proxyEndpoint: ProxyEndpoint | undefined;
	counterData: APIRequestCounterData;
	thisWorkerID: number;
};

export type AppointmentsMessageHandlers =
	| 'start-updates'
	| 'stop-updates'
	| 'end-updater'
	| 'continue-updates';

type BranchServicesObject = {
	object: RetrieveBranchServices | undefined;
	status: 'Depleted' | 'Done' | 'Errored' | 'Not-Initialized';
};

type PerformUpdateData = {
	branchesToProcess: BranchesToProcess;
	retrieveBranchServices: BranchServicesObject;
	requestCounter: CountAPIRequest;
	thisWorkerID: number;
	elasticBranches: BranchModule;
	elasticErrors: ErrorModule;
	proxyEndpoint: ProxyEndpoint | undefined;
};

// ################################################################################################
// ### Interface ##################################################################################
// ################################################################################################
