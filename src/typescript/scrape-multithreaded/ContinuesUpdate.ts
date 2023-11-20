import { BranchModule, ISingleBranchQueryResponse } from '../elastic/BranchModel';
import { IEndpoint, IProxyIP } from '../proxy-management/ProxyCollection';
import { SmartProxyCollection } from '../proxy-management/SmartProxyCollection';
import { BranchesToProcess } from '../redis/BranchesToProcess';
import { ProcessedBranches } from '../redis/ProcessedBranches';
import path from 'path';
import { IMessageHFArguments, MessagesHandler } from './messages/HandleThreadMessages';
import { IMMessageHandlers } from './IpManager';
import { CustomWorker } from './CWorker';

// ContinuesUpdate -- creates w thread/s -->
// --> IP Management -- creates w thread/s -->
// --> Branch Updater: Performs Update.
// Branch Updater <-- pop branch for update -- Elastic Branches.
// Branch Updater -- push branch after successful update --> Elastic Done queue.

export class ContinuesUpdate {
	private IpManagers: { [key: number]: CustomWorker | null } = {};
	private workerScriptPath;

	constructor(private useProxy: boolean) {
		this.workerScriptPath = path.join(__dirname, 'IpManager.js');
		// console.log('[ContinuesUpdate][constructor] Worker Script Path: ', this.workerScriptPath);
	}

	private async setupQueues() {
		const branchesModule = new BranchModule();

		// Populate Redis-cloud queue with branches that needs update:

		// 1. Dequeue Unhandled branches.
		const processQueue = new BranchesToProcess();
		const unhandledBranches = await processQueue.dequeueBranches();

		// 2. Dequeue Completed branches.
		const doneQueue = new ProcessedBranches();
		const processedBranches = await doneQueue.dequeueBranches();

		// 3. Generate an array of known branch ID's.
		const branchIds = unhandledBranches.concat(processedBranches).map((pair) => pair.branchId);

		// 4. Query for all the branches that are not in some queue (Failures).
		const notInQueues = await branchesModule.exclusiveQnomyCodes(branchIds);

		// 5. Reconstruct the data for 'Process Queue': [Failures][Unprocessed][processed].
		const enqueueBranches = notInQueues.concat(unhandledBranches).concat(processedBranches);

		// 6. Enqueue Branches To Update.
		const enqueuedAmount = await processQueue.enqueueBranches(enqueueBranches);

		return { notInQueues, processedBranches, unhandledBranches, enqueuedAmount };
	}

	private setupMessageManagement() {
		const mHandler = new MessagesHandler<CUMessageHandlers>();

		mHandler.addMessageHandler(
			'manager-depleted',
			(data: IMessageHFArguments<CUMessageHandlers>) => {
				const { operationData, cWorker, message } = data;
				console.log(`Ip Manager ${cWorker.threadId} consumed 300 requests`);
				cWorker.postMessage<IMMessageHandlers>({ handlerName: 'stop-endpoint' });
			}
		);

		mHandler.addMessageHandler(
			'manager-done',
			(data: IMessageHFArguments<CUMessageHandlers>) => {
				const { message, operationData, cWorker } = data;
				console.log(`Ip Manager ${cWorker.threadId} no more branches to update`);
				cWorker.postMessage<IMMessageHandlers>({ handlerName: 'stop-endpoint' });
			}
		);

		return mHandler;
	}

	private async setupIpManagement() {
		// Setup Ip Management to prevent excessive requesting.

		// Create Proxy Object, that contains proxy endpoint data.
		let proxyObject: IProxyIP | null = null;
		if (this.useProxy) {
			const smartProxy = new SmartProxyCollection();
			proxyObject = await smartProxy.getProxyObject();
		}

		// Setup functions for message handling.
		const mHandler = this.setupMessageManagement();

		// Create threads for each IP \ Proxy Endpoint resource.
		// Initiate events for each thread.
		if (proxyObject) {
			const endpoints = proxyObject.endpoints;
			for (const endpoint of endpoints) {
				const ipManager = new CustomWorker(this.workerScriptPath, {
					workerData: {
						ipEndpoint: endpoint,
					},
				});
				if (ipManager.threadId !== undefined) {
					ipManager.once('online', () => this.IpManagerOnline(ipManager, endpoint));
					ipManager.once<CUMessageHandlers>('message', (message) =>
						mHandler.handle({
							message,
							cWorker: ipManager,
							operationData: undefined,
						})
					);
					ipManager.once('error', (error) =>
						this.IpManagerError(ipManager.threadId, error)
					);
					ipManager.once('exit', (code) => this.IpManagerExit(ipManager.threadId, code));
					this.IpManagers[ipManager.threadId] = ipManager;
				}
			}
		} // TODO: No Proxy Object
	}

	// ########################################################
	// ### Setup Events Functions #############################
	// ########################################################

	private async IpManagerOnline(cWorker: CustomWorker, endpoint: IEndpoint) {
		console.log(`Ip Manager ${cWorker.threadId} is online`);
		cWorker.postMessage<IMMessageHandlers>({
			handlerName: 'start-endpoint',
			handlerData: [endpoint],
		});
	}

	private async IpManagerError(threadId: number, error: Error) {
		console.log(`Ip Manager ${threadId} had error`);
		console.log('Error: ', error);
	}

	private async IpManagerExit(threadId: number, code: number) {
		console.log(`Ip Manager ${threadId} has exited with code ${code}`);
	}

	async test() {
		return await this.setupIpManagement();
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ###################################################################################################
// ### Enums #########################################################################################
// ###################################################################################################

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type CUMessageHandlers = 'manager-done' | 'manager-depleted';
