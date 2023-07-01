"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationGetServices = void 0;
const BaseRequest_1 = require("./BaseRequest");
const BadApiResponse_1 = require("../errors/BadApiResponse");
class LocationGetServices extends BaseRequest_1.BaseApiRequest {
    constructor() {
        super();
        this.requestCookieHeaders = [
            'ARRAffinity',
            'ARRAffinitySameSite',
            'CentralJWTCookie',
            'GCLB',
        ];
        this.requestHeadersKeys = ['token'];
        this.requestUrlAttributes = ['locationId', 'serviceTypeId'];
        this.responseDataKeys = [
            'Success',
            'Results',
            'TotalResults',
            'ErrorMessage',
        ];
        this.nameOfThis = 'LocationGetServices';
    }
    makeRequest(cookies, urlAttribute, headers) {
        return super.makeRequest(cookies, urlAttribute, headers);
    }
    buildRequest(cookies, urlAttribute, headers) {
        return {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://central.qnomy.com/CentralAPI/LocationGetServices?locationId=' +
                urlAttribute['locationId'] +
                '&serviceTypeId=' +
                urlAttribute['serviceTypeId'],
            headers: {
                authority: 'central.qnomy.com',
                accept: 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'he-IL,he;q=0.9',
                'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
                'application-name': 'PostIL',
                authorization: 'JWT ' + headers['token'],
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
    }
    parseResponseData(data) {
        if (!this.isApiResponse(data)) {
            console.error('[LocationGetServices] [parseResponseData] Error: ', {
                data: data,
                nested: this.nestedResponse,
            });
            throw new BadApiResponse_1.BadApiResponse({
                message: 'response does not conform in format',
                source: 'LocationGetServices',
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
            const resultsConform = (data === null || data === void 0 ? void 0 : data.Results[0].serviceId) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].serviceName) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].serviceDescription) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].ServiceTypeId) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].serviceTypeDescription) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].description) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].showStats) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].waitingTime) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].HasCalendarService) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].DynamicFormsEnabled) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].HasFIFOService) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].ExtRef) !== undefined &&
                (data === null || data === void 0 ? void 0 : data.Results[0].LocationId) !== undefined;
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
exports.LocationGetServices = LocationGetServices;
// const example = {
// 	Success: true,
// 	Results: [
// 		{
// 			serviceId: 702,
// 			serviceName: 'אשנב כל ',
// 			serviceDescription: '',
// 			ServiceTypeId: 25,
// 			serviceTypeDescription: '',
// 			description: 'עד 10 שוברים לתור',
// 			showStats: false,
// 			waitingTime: 0,
// 			HasCalendarService: true,
// 			DynamicFormsEnabled: false,
// 			HasFIFOService: false,
// 			ExtRef: '1',
// 			LocationId: 278,
// 		},
// 		{
// 			serviceId: 704,
// 			serviceName: 'מסירת דואר ללקוח',
// 			serviceDescription: '',
// 			ServiceTypeId: 25,
// 			serviceTypeDescription: '',
// 			description: 'מסירת רשומים וחבילות ללקוח',
// 			showStats: false,
// 			waitingTime: 0,
// 			HasCalendarService: true,
// 			DynamicFormsEnabled: false,
// 			HasFIFOService: false,
// 			ExtRef: '2',
// 			LocationId: 278,
// 		},
// 	],
// 	Page: 0,
// 	ResultsPerPage: 0,
// 	TotalResults: 2,
// 	ErrorMessage: null,
// 	ErrorNumber: 0,
// 	Messages: null,
// };
