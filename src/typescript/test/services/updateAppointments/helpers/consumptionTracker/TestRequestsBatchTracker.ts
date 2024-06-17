import { buildMutexRequestsBatchTracker } from '../../../../../services/updateAppointments/helpers/consumptionTracker/RequestsBatchTracker';

console.log('** Test Requests Batch Tracker **');

export const testBuildMutexRequestsBatchTracker = async () => {
	console.log('** (1) Test Build Mutex Requests Batch Tracker **');
	const tracker = buildMutexRequestsBatchTracker(300);
	console.log('[testSingleThreadTracking] buildMutexRequestsBatchTracker(300)');

	console.log(
		'[testSingleThreadTracking] trackRequestBatch({ batchSize: 48 }) : ',
		await tracker.trackRequestBatch({ batchSize: 48 })
	);
	console.log(
		'[testSingleThreadTracking] trackRequestBatch({ batchSize: 48 }) : ',
		await tracker.trackRequestBatch({ batchSize: 48 })
	);
	console.log(
		'[testSingleThreadTracking] trackRequestBatch({ batchSize: 48 }) : ',
		await tracker.trackRequestBatch({ batchSize: 48 })
	);
	console.log(
		'[testSingleThreadTracking] trackRequestBatch({ batchSize: 157 }) : ',
		await tracker.trackRequestBatch({ batchSize: 157 })
	);
	console.log(
		'[testSingleThreadTracking] trackRequestBatch({ batchSize: 1 }) : ',
		await tracker.trackRequestBatch({ batchSize: 1 })
	);
};
