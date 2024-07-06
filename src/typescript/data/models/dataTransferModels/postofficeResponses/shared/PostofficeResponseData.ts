export interface IPostofficeResponseData {
	Success: boolean;
	Results: { [key: string]: any }[] | { [key: string]: any } | null;
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: string | null;
	ErrorNumber: number;
	Messages: { [key: string]: any }[] | null;
}

export interface IPostOfficeApiResponse<SR extends IPostofficeResponseData> {
	status: number;
	statusText: string;
	cookies: string[];
	responseData: SR;
}
