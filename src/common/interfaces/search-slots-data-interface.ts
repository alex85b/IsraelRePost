export interface ISearchDatesData {
	Success: true;
	Results: { Time: number }[];
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: any;
	ErrorNumber: number;
	Messages: any;
}
