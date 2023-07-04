"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAvailableDates = void 0;
const base_build_request_1 = require("./base-build-request");
class SearchAvailableDates extends base_build_request_1.BaseApiRequestBuilder {
    constructor(cookies, authorization, urlAttributes) {
        super(cookies, authorization, urlAttributes);
        this.cookiesToFInd = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];
    }
    buildApiRequest() {
        var _a, _b, _c, _d, _e, _f, _g;
        const reformatCookies = this.reformatForAxios(this.cookies || {}, this.cookiesToFInd);
        const returnApiRequest = {
            config: {
                method: 'get',
                maxBodyLength: Infinity,
                url: 'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
                    ((_a = this.urlAttributes) === null || _a === void 0 ? void 0 : _a.serviceId) +
                    '&startDate=' +
                    ((_c = (_b = this.urlAttributes) === null || _b === void 0 ? void 0 : _b.startDate) === null || _c === void 0 ? void 0 : _c.yyyy) +
                    '-' +
                    ((_e = (_d = this.urlAttributes) === null || _d === void 0 ? void 0 : _d.startDate) === null || _e === void 0 ? void 0 : _e.mm) +
                    '-' +
                    ((_g = (_f = this.urlAttributes) === null || _f === void 0 ? void 0 : _f.startDate) === null || _g === void 0 ? void 0 : _g.dd),
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
exports.SearchAvailableDates = SearchAvailableDates;
