import { ParentPortWrapper } from '../../../../../services/updateAppointments/helpers/threadCommunication/CommunicationWrappers';
import { AppointmentsUpdatingMessages } from '../../../../../services/updateAppointments/helpers/threadCommunication/Messages';
import { ConstructLogMessage } from '../../../../../shared/classes/ConstructLogMessage';
import { parentPort, threadId } from 'worker_threads';

const logMessage = new ConstructLogMessage([`WorkerDummyStub ${threadId}`]);
if (!parentPort) throw Error(logMessage.createLogMessage({ subject: 'Invalid parentPort' }));
const communicationWrapper = new ParentPortWrapper({
	parentPort: parentPort,
});

for (let i = 0; i < 86; i++) {
	communicationWrapper.sendMessage(AppointmentsUpdatingMessages.ContinueUpdates);
}

process.exit(1);
