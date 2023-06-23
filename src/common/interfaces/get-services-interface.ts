export interface ILocationGetServices {
	Success: boolean;
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
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: any;
	ErrorNumber: number;
	Messages: any;
}
