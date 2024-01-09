import { IMMessageHandlers } from '../continues-update/IpManager';
import { AbstractCustomWorker } from './AbstractCustomWorker';
import { IBUMessageHandlers, IBranchUpdaterWData } from '../continues-update/BranchUpdater';

export class BranchUpdaterWorker extends AbstractCustomWorker<
	IBUMessageHandlers,
	IMMessageHandlers
> {
	constructor(filename: string | URL, options: { workerData: IBranchUpdaterWData }) {
		super(filename, options);
	}
}
