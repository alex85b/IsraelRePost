import { workerData, Worker } from 'worker_threads';
import path from 'path';
import { CountAPIRequest } from '../../services/appointments-update/components/atomic-counter/ImplementCounters';

const requestCounterData = workerData.requestCounterData;

//memoryBuffer
console.log('[NodeDepth1][log] workerData : ', workerData);
console.log('[NodeDepth1][log] requestCounterData : ', requestCounterData);
requestCounterData.view[0] = 20;
console.log('[NodeDepth1][log] requestCounterData.view[0] = 20 : ', requestCounterData.view);

const countAPIRequest = new CountAPIRequest(requestCounterData);
console.log('[NodeDepth1][countAPIRequest] isAllowed() : ', countAPIRequest.isAllowed());
console.log('[NodeDepth1][countAPIRequest] isAllowed() : ', countAPIRequest.isAllowed());

const nodeDepth1 = new Worker(path.join(__dirname, 'NodeDepth2.js'), {
	workerData: { requestCounterData: requestCounterData },
});
