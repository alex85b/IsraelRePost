// import { AppointmentsUpdatingMessages } from '../communication/Messages';
// import { HandlerClass, MessageDataPair } from './Handler';

// class HContinueUpdates extends HandlerClass<
// 	number,
// 	typeof AppointmentsUpdatingMessages.ContinueUpdates
// > {
// 	handle(): void {
// 		throw new Error('Method not implemented.');
// 	}

// 	constructor(data: number) {
// 		super(data);
// 	}
// }

// class HEndUpdater extends HandlerClass<
// 	{ value1: string },
// 	typeof AppointmentsUpdatingMessages.EndUpdater
// > {
// 	handle(): void {
// 		throw new Error('Method not implemented.');
// 	}

// 	constructor(data: { value1: string }) {
// 		super(data);
// 	}
// }

// class HStartUpdates extends HandlerClass<
// 	{ value1: string },
// 	typeof AppointmentsUpdatingMessages.StartUpdates
// > {
// 	handle(): void {
// 		throw new Error('Method not implemented.');
// 	}

// 	constructor(data: { value1: string }) {
// 		super(data);
// 	}
// }

// class HStopUpdates extends HandlerClass<
// 	{ value1: string },
// 	typeof AppointmentsUpdatingMessages.StopUpdates
// > {
// 	handle(): void {
// 		throw new Error('Method not implemented.');
// 	}

// 	constructor(data: { value1: string }) {
// 		super(data);
// 	}
// }

// export const testPairing: MessageDataPair<typeof AppointmentsUpdatingMessages> = {
// 	[AppointmentsUpdatingMessages.StartUpdates]: new HStartUpdates({ value1: 'start-updates' }),
// 	[AppointmentsUpdatingMessages.StopUpdates]: new HStopUpdates({ value1: 'stop-updates' }),
// 	[AppointmentsUpdatingMessages.EndUpdater]: new HEndUpdater({ value1: 'end-updater' }),
// 	[AppointmentsUpdatingMessages.ContinueUpdates]: new HContinueUpdates(8),
// };
