import { AbstractCustomWorker } from '../../../services/appointments-update/components/custom-worker/AbstractCustomWorker';
import { AppointmentsWorkerData } from '../../../services/appointments-update/worker-scripts/AppointmentsWorkerScript';
import { AppointmentsMessageHandlers } from '../../workers/logic/AppointmentsMessageHandler';
import { IpManagerMessageHandlers } from '../../workers/logic/IpManagerMessageHandler';

// #############################################################################################
// ### AppointmentsUpdaterWorker ###############################################################
// #############################################################################################

export class AppointmentsUpdaterWorker extends AbstractCustomWorker<
	AppointmentsMessageHandlers,
	IpManagerMessageHandlers
> {
	constructor(filename: string | URL, options: { workerData: AppointmentsWorkerData }) {
		super(filename, options);
	}
}
