import { AbstractCustomWorker } from '../../../services/appointments-update/components/custom-worker/AbstractCustomWorker';
import { IBranchUpdaterWData } from '../../../services/appointments-update/worker-scripts/AppointmentsWorkerScript';
import { AppointmentsMessageHandlers } from '../../workers/logic/AppointmentsMessageHandler';
import { IpManagerMessageHandlers } from '../../workers/logic/IpManagerMessageHandler';

export class AppointmentsUpdaterWorker extends AbstractCustomWorker<
	AppointmentsMessageHandlers,
	IpManagerMessageHandlers
> {
	constructor(filename: string | URL, options: { workerData: IBranchUpdaterWData }) {
		super(filename, options);
	}
}
