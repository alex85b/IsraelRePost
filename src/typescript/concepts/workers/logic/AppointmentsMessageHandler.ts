import {
	RetrieveBranchServicesOptions,
	RetrieveBranchServices,
} from '../../../api/chain-requests/RetrieveBranchServices';
import { BranchModule } from '../../../data/elastic/BranchModel';
import { ErrorIndexService } from '../../../data/elastic/ErrorIndexService';
import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
import { BranchesToProcess } from '../../../data/redis/BranchesToProcess';
import { HandlerFunctionCollection, MessagesHandler } from '../messaging/WorkerMessages';
import { IpManagerMessageHandlers } from './IpManagerMessageHandler';
import { ACustomParentPort } from '../../../services/appointments-update/components/custom-parent/ACustomParentPort';
import { ILimitRequests } from '../../../services/appointments-update/components/request-regulator/LimitRequests';

// ################################################################################################
// ### Class ######################################################################################
// ################################################################################################

export class AppointmentsMessageHandler extends MessagesHandler<
	AppointmentsMessageHandlers,
	IpManagerMessageHandlers
> {
	private proxyEndpoint;
	private requestLimiter: ILimitRequests;
	private branchesToProcess;
	private retrieveBranchServices: BranchServicesObject;
	private elasticBranches;
	private elasticErrors;
	private thisWorkerID;
	private isStopped;
	private parentPort;

	protected functionCollection: HandlerFunctionCollection<
		AppointmentsMessageHandlers,
		IpManagerMessageHandlers
	> = {
		'start-updates': async () => {
			// While no stop request received -
			// Perform Updates of Branch-appointments.
			while (!this.isStopped) {
				const updateResult = await this.performAppointmentsUpdate({
					retrieveBranchServices: this.retrieveBranchServices,
					branchesToProcess: this.branchesToProcess,
					requestLimiter: this.requestLimiter,
					thisWorkerID: this.thisWorkerID,
					elasticBranches: this.elasticBranches,
					elasticErrors: this.elasticErrors,
					proxyEndpoint: this.proxyEndpoint,
				});
				// Handle Update-attempt results.
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
		},
		'end-updater': () => {
			console.log(
				`[Appointments Message Handler: ${this.thisWorkerID}][hEndUpdater] hEndUpdater`
			);
			process.exit(0);
		},
		'continue-updates': async () => {
			this.isStopped = false;
			// While no stop request received -
			// Perform Updates of Branch-appointments.
			while (!this.isStopped) {
				const updateResult = await this.performAppointmentsUpdate({
					retrieveBranchServices: this.retrieveBranchServices,
					branchesToProcess: this.branchesToProcess,
					requestLimiter: this.requestLimiter,
					thisWorkerID: this.thisWorkerID,
					elasticBranches: this.elasticBranches,
					elasticErrors: this.elasticErrors,
					proxyEndpoint: this.proxyEndpoint,
				});
				// Handle Update-attempt results.
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
						// Notify parent that no more updates can be made.
						this.parentPort.postMessage({ handlerName: updateResult });
						return updateResult;
				}
			}
		},
		'stop-updates': () => {
			console.log(
				`[Appointments Message Handler: ${this.thisWorkerID}][hStopUpdater] hStopUpdater`
			);
			this.isStopped = true;
		},
	};

	constructor({
		parentPort,
		proxyEndpoint,
		requestLimiter,
		thisWorkerID,
	}: AppointmentsHandlerData) {
		super();
		this.proxyEndpoint = proxyEndpoint;
		this.requestLimiter = requestLimiter;
		this.elasticBranches = new BranchModule();
		this.elasticErrors = new ErrorIndexService();
		this.thisWorkerID = thisWorkerID;
		this.isStopped = false;
		this.retrieveBranchServices = { object: undefined, status: 'Not-Initialized' };
		this.parentPort = parentPort;
		this.branchesToProcess = new BranchesToProcess();
	}

	private async performAppointmentsUpdate({
		branchesToProcess,
		requestLimiter,
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
				requestLimiter,
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
		let validResponse: IpManagerMessageHandlers | undefined;
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
	requestLimiter: ILimitRequests;
	thisWorkerID: number;
	parentPort: ACustomParentPort<AppointmentsMessageHandlers, IpManagerMessageHandlers>;
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
	requestLimiter: ILimitRequests;
	thisWorkerID: number;
	elasticBranches: BranchModule;
	elasticErrors: ErrorIndexService;
	proxyEndpoint: ProxyEndpoint | undefined;
};
