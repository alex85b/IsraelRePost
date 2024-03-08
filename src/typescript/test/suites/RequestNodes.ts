import { IUserNodeData, UserNode } from '../../api/requests-as-nodes/UserNode';
import { BranchModule, INewServiceRecord } from '../../data/elastic/BranchModel';
import { IErrorMapping } from '../../data/elastic/ErrorIndexService';
import { SmartProxyCollection } from '../../data/proxy-management/SmartProxyCollection';
import { LimitPerMinute } from '../../services/appointments-update/components/request-regulator/LimitRequests';
import {
	IArrayCounterSetup,
	NaturalNumbersArraySetup,
} from '../../services/appointments-update/components/atomic-counter/CounterSetup';

// ###################################################################################################
// ### Test New Request-Nodes ########################################################################
// ###################################################################################################

export const testNodes = async (run: boolean) => {
	if (!run) return;
	console.log('[testNodes] Start');

	const setupData: IArrayCounterSetup = new NaturalNumbersArraySetup({
		counterRangeAndLength: { bottom: 0, length: 2, top: 255 },
	});

	console.log('[testNodes] setupData.setCellValue(41, 1) : ', setupData.setCellValue(41, 1));

	console.log('[testNodes] Set-up requestLimiter');
	const requestLimiter = new LimitPerMinute(setupData);
	console.log('[testNodes] requestLimiter : ', requestLimiter);

	console.log('[testNodes] requestLimiter.isAllowed() : ', requestLimiter.isAllowed());
	console.log('[testNodes] requestLimiter.isAllowed() : ', requestLimiter.isAllowed());

	const branchModule = new BranchModule();
	const allBranches = await branchModule.fetchAllBranches();
	const someBranch = allBranches[91];
	console.log('[testNodes] someBranch : ', someBranch);

	const proxyCollection = new SmartProxyCollection();
	const endpoints = await proxyCollection.getProxyObject();

	const someEndpoint = endpoints[0];
	// const someEndpoint = undefined;

	const updatedServices: INewServiceRecord[] = [];
	const IsraelPostApiErrors: IErrorMapping = {
		userError: '',
		services: [],
	};

	try {
		const userNodeData: IUserNodeData = {
			updateData: {
				proxyEndpoint: someEndpoint,
				qnomycode: someBranch._source.qnomycode,
			},
			memoryObjects: {
				updatedServices: updatedServices,
				IsraelPostApiErrors: IsraelPostApiErrors,
			},
			sharedCounter: {
				requestLimiter,
			},
		};

		const requestUserNode = new UserNode(userNodeData);
		const requestServiceNodes = await requestUserNode.getChildren();
		console.log('requestServiceNodes : ', requestServiceNodes);

		if (!Array.isArray(requestServiceNodes)) throw Error('[testNodes] No Service Nodes!');
		console.log(`[testNodes] Fetched ${requestServiceNodes.length ?? -1} Service Nodes`);
		const requestServicesNode = requestServiceNodes[0];

		const requestDateNodes = await requestServicesNode.getChildren();
		console.log('requestDateNodes : ', requestDateNodes);
		if (!Array.isArray(requestDateNodes)) throw Error('[testNodes] No Date Nodes!');
		console.log(`[testNodes] Fetched ${requestDateNodes.length ?? -1} Dates Nodes`);
		const requestDateNode = requestDateNodes[0];

		const requestTimeNodes = await requestDateNode.getChildren();
		console.log('requestTimeNodes : ', requestTimeNodes);
		if (!Array.isArray(requestTimeNodes)) throw Error('[testNodes] No Time Nodes!');
		console.log(`[testNodes] Fetched ${requestDateNodes.length ?? -1} Times Nodes`);
		const requestTimeNode = requestTimeNodes[0];

		const timeNodeResponse = await requestTimeNode.getChildren();
		console.log('timeNodeResponse (Depleted|Errored|Done): ', timeNodeResponse);
	} catch (error) {}

	console.log('updatedServices : ', updatedServices);
	console.log('IsraelPostApiErrors : ', IsraelPostApiErrors);
	console.log('[testNodes] End');
};
