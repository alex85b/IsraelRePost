export interface ILocationGetServices {
	Results: {
		serviceId: number;
		serviceName: string;
		serviceDescription: string;
		ServiceTypeId: number;
		serviceTypeDescription: string;
		description: string;
		showStats: boolean;
		waitingTime: number;
		HasCalendarService: boolean;
		DynamicFormsEnabled: boolean;
		HasFIFOService: boolean;
		ExtRef: string;
		LocationId: number;
	}[];
}
