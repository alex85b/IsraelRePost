"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAvailableSlots = void 0;
const base_build_request_1 = require("./base-build-request");
class SearchAvailableSlots extends base_build_request_1.BaseApiRequestBuilder {
    constructor(cookies, authorization, urlAttributes) {
        super(cookies, authorization, urlAttributes);
        this.cookiesToFInd = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];
    }
    buildApiRequest() {
        var _a, _b, _c;
        const reformatCookies = this.reformatForAxios(this.cookies || {}, this.cookiesToFInd);
        const returnApiRequest = {
            config: {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=' +
                    ((_a = this.urlAttributes) === null || _a === void 0 ? void 0 : _a.calendarId) +
                    '&ServiceId=' +
                    ((_b = this.urlAttributes) === null || _b === void 0 ? void 0 : _b.serviceId) +
                    '&dayPart=' +
                    ((_c = this.urlAttributes) === null || _c === void 0 ? void 0 : _c.dayPart),
                headers: {
                    authority: 'central.qnomy.com',
                    accept: 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'he-IL,he;q=0.9',
                    'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
                    'application-name': 'PostIL',
                    authorization: 'JWT ' + this.authorization,
                    origin: 'https://israelpost.co.il',
                    'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    Cookie: reformatCookies,
                },
            },
        };
        return returnApiRequest;
    }
}
exports.SearchAvailableSlots = SearchAvailableSlots;
