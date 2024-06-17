import { parentPort, workerData, threadId } from 'worker_threads';
import { ParentPortWrapper } from '../../../../../services/updateAppointments/helpers/threadCommunication/CommunicationWrappers';
import {
	ThreadMessage,
	ContinuesUpdateMessages,
} from '../../../../../services/updateAppointments/helpers/threadCommunication/Messages';
import {
	getMemoryViewParameters,
	parseAsMemoryView,
} from '../../../../../data/models/dataTransferModels/ThreadSharedMemory';
import { AtomicArrayWriter } from '../../../../../services/updateAppointments/helpers/concurrency/AtomicArrayWriter';
import { RequestTracker } from '../../../../../services/updateAppointments/helpers/consumptionTracker/RequestTracker';

const MODULE_NAME = `[WorkerDummyStub ${threadId}] `;

if (!parentPort) throw Error(MODULE_NAME + 'Invalid parentPort');
if (!workerData) throw Error(MODULE_NAME + 'Invalid workerData');

console.log(MODULE_NAME + 'workerData : ', JSON.stringify(workerData));

const memoryView = parseAsMemoryView(workerData);
const atomWriter = new AtomicArrayWriter({
	memoryView: memoryView,
	viewParametersExtractor: getMemoryViewParameters,
});

const tracker = new RequestTracker({
	atomicArrayWriter: atomWriter,
});

for (let i = 0; i < 10; i++) {
	const requestTrack = tracker.trackRequest();
	console.log(MODULE_NAME + 'requestTrack : ', requestTrack);
	if (requestTrack.reason !== 'OK') break;
}
