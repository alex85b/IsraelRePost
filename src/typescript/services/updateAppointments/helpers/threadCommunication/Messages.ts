export enum AppointmentsUpdatingMessages {
	StartUpdates = 'start-updates',
	StopUpdates = 'stop-updates',
	EndUpdater = 'end-updater',
	ContinueUpdates = 'continue-updates',
}

export enum IpManagerUpdaterMessages {
	UpdaterDone = 'updater-done',
	UpdaterDepleted = 'updater-depleted',
}

export enum IpManagerContinuesMessages {
	StartEndpoint = 'start-endpoint',
	StopEndpoint = 'stop-endpoint',
}

export enum ContinuesUpdateMessages {
	ManagerDone = 'manager-done',
	ManagerDepleted = 'manager-depleted',
}

export type ThreadMessage =
	| AppointmentsUpdatingMessages
	| IpManagerUpdaterMessages
	| IpManagerContinuesMessages
	| ContinuesUpdateMessages;
