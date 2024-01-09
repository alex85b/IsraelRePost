import { CUMessageHandlers } from '../continues-update/ContinuesUpdate';
import { IMMessageHandlers, IpMWorkerData } from '../continues-update/IpManager';
import { AbstractCustomWorker } from './AbstractCustomWorker';

export class IpManagementWorker extends AbstractCustomWorker<IMMessageHandlers, CUMessageHandlers> {
	constructor(filename: string | URL, options: { workerData: IpMWorkerData }) {
		super(filename, options);
	}
}
