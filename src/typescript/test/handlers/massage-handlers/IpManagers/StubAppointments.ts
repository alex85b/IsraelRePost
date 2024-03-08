import { parentPort, workerData, threadId } from 'worker_threads';
import { IpManagerParentPort } from '../../../../concepts/ports/parent-ports/IpManagerParentPort';
import {
	ILimitRequests,
	LimitPerMinute,
} from '../../../../services/appointments-update/components/request-regulator/LimitRequests';
import { NaturalNumbersArraySetup } from '../../../../services/appointments-update/components/atomic-counter/CounterSetup';
// import { CountAPIRequest } from '../../../../services/appointments-update/components/atomic-counter/ImplementCounters';

const setupData = () => {
	if (!parentPort) throw Error('[Stub Appointments][setup] parentPort is null or undefined ');
	const ipManagerParentPort = new IpManagerParentPort(parentPort);
	const { CounterData, proxyEndpoint } = ipManagerParentPort.extractData(workerData);
	console.log(`[Stub Appointments ${threadId}] workerData : `, workerData);
	const requestLimiter: ILimitRequests = new LimitPerMinute(
		new NaturalNumbersArraySetup({ counterRangeAndLength: { bottom: 0, top: 255, length: 2 } })
	);
	return { ipManagerParentPort, proxyEndpoint };
};

let runStub = true;

const listen = async () => {
	const { ipManagerParentPort, proxyEndpoint } = setupData();

	ipManagerParentPort.on('message', async (message) => {
		console.log(`[Stub Appointments ${threadId}][listen] message : `, message);
		switch (
			message.handlerName
			// case 'continue-updates':
			// 	await fakeUpdates(countRequests, ipManagerParentPort);
			// 	break;
			// case 'end-updater':
			// 	process.exit(0);
			// case 'stop-updates':
			// 	runStub = false;
			// 	break;
			// case 'start-updates':
			// 	await fakeUpdates(countRequests, ipManagerParentPort);
			// 	break;
		) {
		}
	});
};

const fakeUpdates = async (
	// countRequests: CountAPIRequest,
	ipManagerParentPort: IpManagerParentPort
) => {
	let response: boolean | undefined = undefined;
	do {
		// response = await update(countRequests);
	} while (response === true && runStub);
	if (runStub) ipManagerParentPort.postMessage({ handlerName: 'updater-depleted' });
};

// const update = (countRequests: CountAPIRequest) => {
// 	return new Promise<boolean>((resolve, reject) => {
// 		setTimeout(() => {
// 			const isAllowed = countRequests.isAllowed();
// 			console.log(
// 				`[Stub Appointments ${threadId}][update] countRequests.isAllowed() : `,
// 				isAllowed
// 			);
// 			resolve(isAllowed.allowed);
// 		}, 3000);
// 	});
// };

listen();
