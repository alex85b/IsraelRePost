// import { Worker } from 'worker_threads';
// import path from 'path';
// import { APIRequestCounterData } from '../../services/appointments-update/components/atomic-counter/ImplementCounters';

// export const setupNodeDepth1 = (run: boolean) => {
// 	if (!run) return;
// 	const requestCounterData = new APIRequestCounterData(48);
// 	console.log('[Root][setupNodeDepth1] requestCounterData : ', requestCounterData);

// 	const nodeDepth1 = new Worker(path.join(__dirname, 'NodeDepth1.js'), {
// 		workerData: { requestCounterData: requestCounterData },
// 	});
// 	console.log('[Root][setupNodeDepth1] done.');
// };
