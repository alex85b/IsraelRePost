import { BranchModule } from '../elastic/BranchModel';
import { SmartProxyCollection } from '../proxy-management/SmartProxyCollection';
import { BranchesToProcess } from '../redis/BranchesToProcess';
import { ProcessedBranches } from '../redis/ProcessedBranches';
import { IHandlerFunction, MessagesHandler } from './messages/HandleThreadMessages';
import { IMMessageHandlers } from './IpManager';
import path from 'path';
import { AxiosProxyConfig } from 'axios';
import { IpManagementWorker } from '../custom-worker/IpManagementWorker';

// ContinuesUpdate -- creates w thread/s -->
// --> IP Management -- creates w thread/s -->
// --> Branch Updater: Performs Update.
// Branch Updater <-- pop branch for update -- Redis Branches.
// Branch Updater -- push branch after successful update --> Redis Done queue.

export class ContinuesUpdate {
	private IpManagers: { [key: number]: IpManagementWorker | null } = {};
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

		const hManagerDepleted: IHandlerFunction<CUMessageHandlers, IMMessageHandlers> = ({
			messageCallback,
			senderId,
		}) => {
			if (!messageCallback)
				throw Error('[manager-depleted] handler: messageCallback was not provided');
			messageCallback({ handlerName: 'stop-endpoint' });
			console.log(
				`Continues Update noticed Ip Manager ${senderId ?? 'Unknown'} consumed 300 requests`
			);
		};

		const hManagerDone: IHandlerFunction<CUMessageHandlers, IMMessageHandlers> = ({
			messageCallback,
			senderId,
		}) => {
			if (!messageCallback)
				throw Error('[manager-depleted] handler: messageCallback was not provided');
			messageCallback({ handlerName: 'stop-endpoint' });
			console.log(
				`Continues Update noticed Ip Manager ${
					senderId ?? 'Unknown'
				} has no more branches to update`
			);
		};

		mHandler.addMessageHandler('manager-depleted', hManagerDepleted);
		mHandler.addMessageHandler('manager-done', hManagerDone);

		return mHandler;
	}

	private async addIpManager(
		mHandler: MessagesHandler<CUMessageHandlers>,
		aProxyConfig?: AxiosProxyConfig
	) {
		const ipManager = new IpManagementWorker(this.workerScriptPath, {
			workerData: aProxyConfig,
		});
		if (ipManager.threadId !== undefined) {
			ipManager.once('online', () => this.IpManagerOnline(ipManager));
			ipManager.once('message', (message) =>
				mHandler.handle({
					handlerName: message.handlerName,
					handlerData: message.handlerData,
				})
			);
			ipManager.once('error', (error) => this.IpManagerError(ipManager.threadId, error));
			ipManager.once('exit', (code) => this.IpManagerExit(ipManager.threadId, code));
			this.IpManagers[ipManager.threadId] = ipManager;
		}
	}

	// Setup Ip Management to prevent excessive requesting.
	private async setupIpManagement() {
		// Setup functions for message handling.
		const mHandler = this.setupMessageManagement();
		if (this.useProxy) {
			// Create Proxy Object, that contains proxy endpoint data.
			const proxyObject = await new SmartProxyCollection().getProxyObject();
			const endpoints = proxyObject.endpoints;
			// Create threads for each IP \ Proxy Endpoint resource.
			// Initiate events for each thread.
			for (const endpoint of endpoints) {
				const aProxyConfig: AxiosProxyConfig = {
					host: endpoint.endPoint,
					port: Number.parseInt(endpoint.port),
					auth: { username: proxyObject.userName, password: proxyObject.password },
				};
				this.addIpManager(mHandler, aProxyConfig);
			}
		} else {
			// Create a single Ip Manager for a single Ip.
			this.addIpManager(mHandler);
		}
	}

	// ########################################################
	// ### Setup Events Functions #############################
	// ########################################################

	private async IpManagerOnline(ipManagementWorker: IpManagementWorker) {
		console.log(`Continues Update noticed Ip Manager ${ipManagementWorker.threadId} is online`);
		ipManagementWorker.postMessage({
			handlerName: 'start-endpoint',
		});
	}

	private async IpManagerError(threadId: number, error: Error) {
		console.log(`Continues Update noticed Ip Manager ${threadId} had error`);
		console.log('Error: ', error);
	}

	private async IpManagerExit(threadId: number, code: number) {
		console.log(`Continues Update noticed Ip Manager ${threadId} has exited with code ${code}`);
	}

	async test() {
		return await this.setupIpManagement();
	}
}

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type CUMessageHandlers = 'manager-done' | 'manager-depleted';
