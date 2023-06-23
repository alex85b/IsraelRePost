export interface ISearchAvailableDatesData {
	Success: boolean;
	Results: {
		calendarDate: string;
		calendarId: number;
	}[];
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: any;
	ErrorNumber: number;
	Messages: any[];
}
