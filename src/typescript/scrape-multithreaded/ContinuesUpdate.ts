import { BranchModule } from '../elastic/BranchModel';
import { SmartProxyCollection } from '../proxy-management/SmartProxyCollection';
import { BranchesToProcess } from '../redis/BranchesToProcess';
import { ProcessedBranches } from '../redis/ProcessedBranches';
import { IHandlerFunction, MessagesHandler } from './messages/HandleThreadMessages';
import { IMMessageHandlers } from './IpManager';
import path from 'path';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';
import { IpManagementWorker } from '../custom-worker/IpManagementWorker';

/**
 * Represents the first level of depth in the continuous update tree.
 * Communicates directly with the second level: 'Ip Managers' Worker threads.
 */
export class ContinuesUpdate {
	private IpManagers: { [key: number]: IpManagementWorker | null } = {};
	private workerScriptPath;

	/**
	 * Constructor to initialize the ContinuesUpdate instance.
	 * @param useProxy - A boolean indicating whether to use a proxy.
	 */
	constructor(private useProxy: boolean) {
		this.workerScriptPath = path.join(__dirname, 'IpManager.js');
	}

	/**
	 * Method to set up queues for processing branches.
	 * @returns An object containing information about the setup.
	 */
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

	/**
	 * Method to set up message management handlers.
	 * @returns An instance of MessagesHandler with configured handlers.
	 */
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

	/**
	 * Method to add an 'Ip Manager' worker thread instance to 'this.IpManagers'.
	 * @param mHandler - An instance of MessagesHandler, for linking 'on message' events to handlers.
	 * @param proxyEndpoint - Optional ProxyEndpoint data.
	 */
	private async addIpManager(
		mHandler: MessagesHandler<CUMessageHandlers>,
		proxyEndpoint?: ProxyEndpoint
	) {
		const ipManager = new IpManagementWorker(this.workerScriptPath, {
			workerData: { proxyEndpoint: proxyEndpoint },
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

	/**
	 * Method to set up Ip Management to prevent excessive requesting.
	 */
	private async setupIpManagement() {
		// Setup functions for message handling.
		const mHandler = this.setupMessageManagement();
		if (this.useProxy) {
			// Create Proxy Object, that contains proxy endpoint data.
			const endpoints = await new SmartProxyCollection().getProxyObject();
			// Create threads for each IP \ Proxy Endpoint resource.
			// Initiate events for each thread.
			for (const endpoint of endpoints) {
				this.addIpManager(mHandler, endpoint);
			}
		} else {
			// Create a single Ip Manager for a single Ip.
			this.addIpManager(mHandler);
		}
	}

	// ########################################################
	// ### Setup Events Functions #############################
	// ########################################################

	/**
	 * Event handling function for Ip Manager online event.
	 * @param ipManagementWorker - An instance of IpManagementWorker.
	 */
	private async IpManagerOnline(ipManagementWorker: IpManagementWorker) {
		console.log(`Continues Update noticed Ip Manager ${ipManagementWorker.threadId} is online`);
		ipManagementWorker.postMessage({
			handlerName: 'start-endpoint',
		});
	}

	/**
	 * Event handling function for Ip Manager error event.
	 * @param threadId - The threadId of the Ip Manager.
	 * @param error - The error object.
	 */
	private async IpManagerError(threadId: number, error: Error) {
		console.log(`Continues Update noticed Ip Manager ${threadId} had error`);
		console.log('Error: ', error);
	}

	/**
	 * Event handling function for Ip Manager exit event.
	 * @param threadId - The threadId of the Ip Manager.
	 * @param code - The exit code.
	 */
	private async IpManagerExit(threadId: number, code: number) {
		console.log(`Continues Update noticed Ip Manager ${threadId} has exited with code ${code}`);
	}

	// ########################################################
	// ### Class Services #####################################
	// ########################################################

	/**
	 * Test method to be used for setupIpManagement.
	 * @returns A promise that resolves when the setup is complete.
	 */
	async test() {
		return await this.setupIpManagement();
	}
}

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type CUMessageHandlers = 'manager-done' | 'manager-depleted';
