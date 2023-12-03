import { parentPort, threadId } from 'worker_threads';
import { MessagesHandler } from '../scrape-multithreaded/messages/HandleThreadMessages';

const messagesHandler = new MessagesHandler<IBUMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);

const listen = () => {
	parentPort?.on('message', (message) => {
		// const [requestsAllowedBuffer, requestCounterBuffer] = message;
		// console.log(message);
		// console.log(requestsAllowedBuffer);
		// console.log(requestCounterBuffer);
		// for (let unknown in message) {
		// 	console.log(unknown);
		// }
	});
};

listen();

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type IBUMessageHandlers =
	| 'start-updates'
	| 'stop-updates'
	| 'end-updater'
	| 'continue-updates';
