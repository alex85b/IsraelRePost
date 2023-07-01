"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAvailableSlots = void 0;
const BaseRequest_1 = require("./BaseRequest");
const BadApiResponse_1 = require("../errors/BadApiResponse");
class SearchAvailableSlots extends BaseRequest_1.BaseApiRequest {
    constructor() {
        super();
        this.nameOfThis = 'SearchAvailableSlots';
        this.requestCookieHeaders = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];
        this.requestHeadersKeys = ['token'];
        this.requestUrlAttributes = ['CalendarId', 'ServiceId', 'dayPart'];
        this.responseDataKeys = [
            'Success',
            'Results',
            'TotalResults',
            'ErrorMessage',
        ];
    }
    makeRequest(cookies, urlAttribute, headers) {
        return super.makeRequest(cookies, urlAttribute, headers);
    }
    buildRequest(cookies, urlAttribute, headers) {
        const apiRequest = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=' +
                urlAttribute.CalendarId +
                '&ServiceId=' +
                urlAttribute.ServiceId +
                '&dayPart=' +
                urlAttribute.dayPart,
            headers: {
                authority: 'central.qnomy.com',
                accept: 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'he-IL,he;q=0.9',
                'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
                'application-name': 'PostIL',
                authorization: 'JWT ' + headers.token,
                origin: 'https://israelpost.co.il',
                'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                Cookie: this.reformatForAxios(cookies),
            },
        };
        return apiRequest;
    }
    parseResponseData(data) {
        if (!this.isApiResponse(data)) {
            console.error('[SearchAvailableSlots] [parseResponseData] Error: ', {
                data: data,
                nested: this.nestedResponse,
            });
            throw new BadApiResponse_1.BadApiResponse({
                message: 'response does not conform in format',
                source: 'SearchAvailableSlots',
            });
        }
        return this.transformResponse(data);
    }
    isApiResponse(data) {
        const hasSameStructure = (data === null || data === void 0 ? void 0 : data.Success) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Results) !== undefined &&
            Array.isArray(data === null || data === void 0 ? void 0 : data.Results) &&
            (data === null || data === void 0 ? void 0 : data.Page) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ResultsPerPage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.TotalResults) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorMessage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorNumber) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Messages) !== undefined;
        if (!hasSameStructure)
            return false;
        const hasManyResults = data.Results.length > 0;
        if (hasManyResults) {
            // Save nested response.
            this.nestedResponse = data.Results;
            const resultsConform = (data === null || data === void 0 ? void 0 : data.Results[0].Time) !== undefined;
            if (!resultsConform)
                return false;
        }
        // Neuter nested 'Results'
        data['Results'] = `Nested Object, Stored in: ${this.nameOfThis}.this.nestedResponse`;
        return true;
    }
    getResponseArray() {
        return this.nestedResponse;
    }
}
exports.SearchAvailableSlots = SearchAvailableSlots;
// const example = {
// 	Success: true,
// 	Results: [
// 		{
// 			Time: 485,
// 		},
// 		{
// 			Time: 490,
// 		},
// 		{
// 			Time: 495,
// 		},
// 		{
// 			Time: 505,
// 		},
// 		{
// 			Time: 510,
// 		},
// 		{
// 			Time: 515,
// 		},
// 		/*
//         ...
//         ...
//         ...
//         */
// 	],
// 	Page: 0,
// 	ResultsPerPage: 0,
// 	TotalResults: 30,
// 	ErrorMessage: null,
// 	ErrorNumber: 0,
// 	Messages: null,
// };
