import {
	RetrieveBranchServices,
	RetrieveBranchServicesOptions,
} from '../../api/chain-requests/RetrieveBranchServices';
import { BranchModule } from '../../data/elastic/BranchModel';
import { ErrorIndexService } from '../../data/elastic/ErrorIndexService';
import { ProxyEndpoint } from '../../data/proxy-management/ProxyCollection';
import { BranchesToProcess } from '../../data/redis/BranchesToProcess';
import { ILimitRequests } from '../../services/appointments-update/components/request-regulator/LimitRequests';
import { IpManagerMessageHandlers } from '../workers/logic/IpManagerMessageHandler';

type BranchServicesObject = {
	object: RetrieveBranchServices | undefined;
	status: 'Depleted' | 'Done' | 'Errored' | undefined;
};

type PerformUpdateData = {
	branchesToProcess: BranchesToProcess;
	branchServicesObject: BranchServicesObject;
	requestLimiter: ILimitRequests;
	thisWorkerID: number;
	elasticBranches: BranchModule;
	elasticErrors: ErrorIndexService;
	proxyEndpoint: ProxyEndpoint | undefined;
};

type UpdateResponseObject = {
	fetchNext: boolean;
	stopReason: 'updater-done' | 'updater-depleted' | undefined;
};

type PerformUpdateResponse = Promise<UpdateResponseObject>;

const performAppointmentsUpdate = async (
	performUpdateData: PerformUpdateData
): PerformUpdateResponse => {
	let { object, status } = performUpdateData.branchServicesObject;
	if (object === undefined) {
		// A brand new update - Fetch a Branch data, to perform appointments update.
		const updateBranch = await performUpdateData.branchesToProcess.dequeueBranch();
		if (!updateBranch) return { fetchNext: false, stopReason: 'updater-done' };
		const { branchId, qnomycode } = updateBranch;
		console.log(
			`[Appointments Message Handler: ${performUpdateData.thisWorkerID}][perform Appointments Update] branchId: ${branchId}`
		);
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Construct BranchAppointments (data then class).
		const branchAppointmentOptions: RetrieveBranchServicesOptions = {
			branchCodePair: { branchId, qnomycode },
			requestLimiter: performUpdateData.requestLimiter,
			proxyEndpoint: performUpdateData.proxyEndpoint,
		};
		object = new RetrieveBranchServices(branchAppointmentOptions);
	} else {
		console.log(
			`[Appointments Message Handler: ${performUpdateData.thisWorkerID}][perform Appointments Update] Continuing Services Retrieval: `,
			object.getBranchData()
		);
	}
	// Perform an Update of branch's appointments and \ or errors.
	const _status = await object.performUpdate();
	console.log(
		`[Appointments Message Handler: ${performUpdateData.thisWorkerID}][perform Appointments Update] status: ${status}`
	);
	let validResponse: IpManagerMessageHandlers | undefined;
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	switch (_status) {
		case 'Done':
			// Write updated-appointment to Database (Currently Elastic).
			object.getUpdatedAppointments();
			const updateResponse = await performUpdateData.elasticBranches.updateBranchServices(
				object.getBranchData().branchId,
				object.getUpdatedAppointments()
			);
			object = undefined;
			status = 'Done';
			return { fetchNext: true, stopReason: undefined };
		case 'Depleted':
			status = 'Depleted';
			validResponse = 'updater-depleted';
			return { fetchNext: false, stopReason: 'updater-depleted' };
		case 'Error':
			// Write update-errors to Database (Currently Elastic).
			const errorResponse = await performUpdateData.elasticErrors.updateAddError(
				object.getUpdateErrors(),
				Number(object.getBranchData().branchId)
			);
			object = undefined;
			status = 'Errored';
			return { fetchNext: true, stopReason: undefined };
	}
};
