import { IUserNodeData, UserNode } from '../../api/requests-as-nodes/UserNode';
import {
	APIRequestCounterData,
	CountAPIRequest,
} from '../../services/appointments-update/components/atomic-counter/ImplementCounters';
import { RequestCounter } from '../../services/appointments-update/components/atomic-counter/RequestCounter';
import { RequestsAllowed } from '../../services/appointments-update/components/atomic-counter/RequestsAllowed';
import { BranchModule, INewServiceRecord } from '../../data/elastic/BranchModel';
import { IErrorMapping } from '../../data/elastic/ErrorModel';
import { SmartProxyCollection } from '../../data/proxy-management/SmartProxyCollection';

// ###################################################################################################
// ### Test New Request-Nodes ########################################################################
// ###################################################################################################

export const testNodes = async (run: boolean) => {
	if (!run) return;
	console.log('[testNodes] Start');

	const requestCounterData = new APIRequestCounterData(48);
	const requestCounter = new CountAPIRequest(requestCounterData);

	const branchModule = new BranchModule();
	const allBranches = await branchModule.fetchAllBranches();
	const someBranch = allBranches[91];

	const proxyCollection = new SmartProxyCollection();
	const endpoints = await proxyCollection.getProxyObject();
	// const someEndpoint = endpoints[0];
	const someEndpoint = undefined;

	const updatedServices: INewServiceRecord[] = [];
	const IsraelPostApiErrors: IErrorMapping = {
		userError: '',
		services: [],
	};

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
			requestCounter: requestCounter,
		},
	};
	const requestUserNode = new UserNode(userNodeData);
	const requestServiceNodes = await requestUserNode.getChildren();
	console.log('requestServiceNodes : ', requestServiceNodes);

	if (!Array.isArray(requestServiceNodes)) throw Error('[testNodes] No Service Nodes!');
	const requestServicesNode = requestServiceNodes[0];

	const requestDateNodes = await requestServicesNode.getChildren();
	console.log('requestDateNodes : ', requestDateNodes);
	if (!Array.isArray(requestDateNodes)) throw Error('[testNodes] No Date Nodes!');
	const requestDateNode = requestDateNodes[0];

	const requestTimeNodes = await requestDateNode.getChildren();
	console.log('requestTimeNodes : ', requestTimeNodes);
	if (!Array.isArray(requestTimeNodes)) throw Error('[testNodes] No Time Nodes!');
	const requestTimeNode = requestTimeNodes[0];

	const timeNodeResponse = await requestTimeNode.getChildren();
	console.log('timeNodeResponse (Depleted|Errored|Done): ', timeNodeResponse);

	console.log('updatedServices : ', updatedServices);
	console.log('IsraelPostApiErrors : ', IsraelPostApiErrors);
	console.log('[testNodes] End');
};
