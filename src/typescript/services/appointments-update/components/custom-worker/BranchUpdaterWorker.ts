import { IMMessageHandlers } from '../../worker-scripts/IpManagerWorkerScript';
import { AbstractCustomWorker } from './AbstractCustomWorker';
import {
	IBUMessageHandlers,
	IBranchUpdaterWData,
} from '../../worker-scripts/AppointmentsWorkerScript';

export class BranchUpdaterWorker extends AbstractCustomWorker<
	IBUMessageHandlers,
	IMMessageHandlers
> {
	constructor(filename: string | URL, options: { workerData: IBranchUpdaterWData }) {
		super(filename, options);
	}
}
