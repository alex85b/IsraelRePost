import { AppointmentsUpdatingMessages } from '../communication/Messages';
import { HandlerClass } from './Handler';

class HContinueUpdates extends HandlerClass<number, typeof AppointmentsUpdatingMessages> {
	handle(): void {
		throw new Error('Method not implemented.');
	}
	message: AppointmentsUpdatingMessages.ContinueUpdates;
	protected data: number;

	constructor(message: AppointmentsUpdatingMessages.ContinueUpdates, data: number) {
		super();
		this.message = message;
		this.data = data;
	}
}

class HEndUpdater extends HandlerClass<{ value1: string }, typeof AppointmentsUpdatingMessages> {
	handle(): void {
		throw new Error('Method not implemented.');
	}
	protected data: { value1: string };
	message: AppointmentsUpdatingMessages.EndUpdater;

	constructor(message: AppointmentsUpdatingMessages.EndUpdater, data: { value1: string }) {
		super();
		this.message = message;
		this.data = data;
	}
}

class HStartUpdates extends HandlerClass<{ value1: string }, typeof AppointmentsUpdatingMessages> {
	handle(): void {
		throw new Error('Method not implemented.');
	}
	protected data: { value1: string };
	message: AppointmentsUpdatingMessages.StartUpdates;

	constructor(message: AppointmentsUpdatingMessages.StartUpdates, data: { value1: string }) {
		super();
		this.message = message;
		this.data = data;
	}
}

class HStopUpdates extends HandlerClass<{ value1: string }, typeof AppointmentsUpdatingMessages> {
	handle(): void {
		throw new Error('Method not implemented.');
	}
	protected data: { value1: string };
	message: AppointmentsUpdatingMessages.StopUpdates;

	constructor(message: AppointmentsUpdatingMessages.StopUpdates, data: { value1: string }) {
		super();
		this.message = message;
		this.data = data;
	}
}

const hContinueUpdates = new HContinueUpdates(AppointmentsUpdatingMessages.ContinueUpdates, 8);
const hEndUpdater = new HEndUpdater(AppointmentsUpdatingMessages.EndUpdater, {
	value1: 'Qwe?',
});

// export const testPairing: MessageDataPair<typeof AppointmentsUpdatingMessages> = {
// 	'continue-updates': hContinueUpdates,
// 	'end-updater': hEndUpdater,
// };
