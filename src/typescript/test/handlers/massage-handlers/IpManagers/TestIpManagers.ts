// One of the functions of Ip Manager is to send-back messages, To its parent - Continues Update.
// This Test is written from a point of Continues Update.

import { IpManagementWorker } from '../../../../concepts/ports/worker-ports/IpManagementWorker';
import {} from './StubIpManager';

import path from 'path';

export const TestIpManagers = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Ip Managers] Start');

	// Construct a Ip Manager Script Stub.
	const stubIpManager = new IpManagementWorker(path.join(__dirname, 'StubIpManager.js'), {
		workerData: { proxyEndpoint: undefined },
	});

	// Signal the stubIpManager worker to start.
	stubIpManager.postMessage({ handlerName: 'start-endpoint' });

	console.log('[Test Ip Managers] End');
};
