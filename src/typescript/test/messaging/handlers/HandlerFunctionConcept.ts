export const testHandlersAsStringType = (run: boolean) => {
	if (!run) return;
	type AppointmentsMessageHandlers =
		| 'start-updates'
		| 'stop-updates'
		| 'end-updater'
		| 'continue-updates';

	interface IHandlerClass<S extends string> {
		message: S;
		handle(): void;
	}

	abstract class HandlerClass<D, S extends string> implements IHandlerClass<S> {
		abstract message: S;
		protected abstract data: D;

		handle(): void {
			console.log(this.data);
		}
	}

	class HContinueUpdates extends HandlerClass<number, AppointmentsMessageHandlers> {
		message: 'continue-updates' = 'continue-updates';
		protected data: number;

		constructor(ID: number) {
			super();
			this.data = ID;
		}
	}

	class HEndUpdater extends HandlerClass<{ value1: string }, AppointmentsMessageHandlers> {
		message: 'end-updater' = 'end-updater';
		protected data: { value1: string };

		constructor(data: { value1: string }) {
			super();
			this.data = data;
		}
	}

	class HStartUpdates extends HandlerClass<string, AppointmentsMessageHandlers> {
		message: 'start-updates' = 'start-updates';
		protected data: string;

		constructor(name: string) {
			super();
			this.data = name;
		}
	}

	class HStopUpdates extends HandlerClass<number, AppointmentsMessageHandlers> {
		message: 'stop-updates' = 'stop-updates';
		protected data: number;

		constructor(ID: number) {
			super();
			this.data = ID;
		}
	}

	const hContinueUpdates = new HContinueUpdates(10);
	hContinueUpdates.handle();

	const hEndUpdater = new HEndUpdater({ value1: 'que' });
	hEndUpdater.handle();

	const hStartUpdates = new HStartUpdates('test');
	hStartUpdates.handle();

	const hStopUpdates = new HStopUpdates(-10);
	hStopUpdates.handle();

	type MessageDataPair<S extends string> = {
		[K in S]: IHandlerClass<S> & { message: K };
	};

	const testPairing: MessageDataPair<AppointmentsMessageHandlers> = {
		'continue-updates': hContinueUpdates,
		'start-updates': hStartUpdates,
		'stop-updates': hStopUpdates,
		'end-updater': hEndUpdater,
	};
};

// #############################################################################################
// #############################################################################################
// #############################################################################################

export const testHandlersAsEnums = (run: boolean) => {
	if (!run) return;
	enum AppointmentsUpdatingMessages {
		// StartUpdates = 'start-updates',
		// StopUpdates = 'stop-updates',
		EndUpdater = 'end-updater',
		ContinueUpdates = 'continue-updates',
	}

	type EnumLike = {
		[key: string]: string;
	};

	type EnumValues<T extends EnumLike> = T[keyof T];

	interface IHandlerClass<E extends EnumLike> {
		message: EnumValues<E>;
		handle(): void;
	}

	abstract class HandlerClass<D, E extends EnumLike> implements IHandlerClass<E> {
		abstract message: E[keyof E];
		protected abstract data: D;

		handle(): void {
			console.log(this.data);
		}
	}

	class HContinueUpdates extends HandlerClass<number, typeof AppointmentsUpdatingMessages> {
		message: AppointmentsUpdatingMessages.ContinueUpdates;
		protected data: number;

		constructor(message: AppointmentsUpdatingMessages.ContinueUpdates, data: number) {
			super();
			this.message = message;
			this.data = data;
		}
	}

	class HEndUpdater extends HandlerClass<
		{ value1: string },
		typeof AppointmentsUpdatingMessages
	> {
		protected data: { value1: string };
		message: AppointmentsUpdatingMessages.EndUpdater;

		constructor(message: AppointmentsUpdatingMessages.EndUpdater, data: { value1: string }) {
			super();
			this.message = message;
			this.data = data;
		}
	}

	const hContinueUpdates = new HContinueUpdates(AppointmentsUpdatingMessages.ContinueUpdates, 8);
	// hContinueUpdates.handle();

	const hEndUpdater = new HEndUpdater(AppointmentsUpdatingMessages.EndUpdater, {
		value1: 'Qwe?',
	});
	// hEndUpdater.handle();

	type MessageDataPair<E extends EnumLike> = {
		[K in EnumValues<E>]: IHandlerClass<E> & { message: K };
	};

	const testPairing: MessageDataPair<typeof AppointmentsUpdatingMessages> = {
		'continue-updates': hContinueUpdates,
		'end-updater': hEndUpdater,
	};

	testPairing['continue-updates'].handle();
	testPairing['end-updater'].handle();
};

// #############################################################################################
// #############################################################################################
// #############################################################################################

export const testHandlersEnumsAndFunctions = (run: boolean) => {
	if (!run) return;
	enum AppointmentsUpdatingMessages {
		StartUpdates = 'start-updates',
		StopUpdates = 'stop-updates',
		EndUpdater = 'end-updater',
		ContinueUpdates = 'continue-updates',
	}

	enum Other {
		Option1 = 'One',
		Option2 = 'Two',
	}

	type EnumLike = Record<string, string>;

	type MessageDataPair<E extends EnumLike, R> = {
		[key in keyof E]: R;
	};

	const dataTest: MessageDataPair<
		typeof AppointmentsUpdatingMessages,
		number | 'Stop' | { value: number }
	> = {
		ContinueUpdates: { value: 1 },
		EndUpdater: 1,
		StartUpdates: 'Stop',
		StopUpdates: { value: 2 },
	};

	const dataTest1: MessageDataPair<typeof Other, 'Qwe' | { bad: boolean; good: boolean }> = {
		Option1: 'Qwe',
		Option2: { bad: true, good: false },
	};

	type Handle<E extends EnumLike, R> = (key: keyof E, data: R) => void;

	const testHandle: Handle<typeof AppointmentsUpdatingMessages, typeof dataTest> = (
		key,
		data
	) => {
		console.log(key, data);
		console.log(data[key]);
	};

	const testHandle1: Handle<typeof Other, typeof dataTest1> = (key, data) => {
		console.log(key, data);
		console.log(data[key]);
	};

	testHandle('ContinueUpdates', dataTest);
	testHandle1('Option2', dataTest1);
};
