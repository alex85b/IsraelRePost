"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBranch = void 0;
const base_build_request_1 = require("./base-build-request");
class GetBranch extends base_build_request_1.BaseApiRequestBuilder {
    constructor(cookies, authorization, data) {
        super(cookies, authorization, undefined, data);
        this.cookiesToFInd = [
            '__uzma',
            '__uzmb',
            '__uzme',
            'session-id-mypost',
            '__RequestVerificationToken',
            '__uzmd',
            '__uzmc',
        ];
    }
    buildApiRequest() {
        var _a, _b, _c;
        const reformatCookies = this.reformatForAxios(this.cookies || {}, this.cookiesToFInd);
        const returnApiRequest = {
            config: {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://israelpost.co.il/umbraco/Surface/Branches/GetBranch',
                headers: {
                    authority: 'israelpost.co.il',
                    accept: '*/*',
                    'accept-language': 'he-IL,he;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    cookie: reformatCookies,
                    origin: 'https://israelpost.co.il',
                    referer: 'https://israelpost.co.il/%D7%A9%D7%99%D7%A8%D7%95%D7%AA%D7%99%D7%9D/%D7%90%D7%99%D7%AA%D7%95%D7%A8-%D7%A1%D7%A0%D7%99%D7%A4%D7%99%D7%9D-%D7%95%D7%96%D7%99%D7%9E%D7%95%D7%9F-%D7%AA%D7%95%D7%A8-%D7%91%D7%A7%D7%9C%D7%99%D7%A7/%D7%A1%D7%A0%D7%99%D7%A3/?no=' +
                        ((_a = this.data) === null || _a === void 0 ? void 0 : _a.branchnumber),
                    'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    'x-requested-with': 'XMLHttpRequest',
                },
                data: 'branchnumber=' +
                    ((_b = this.data) === null || _b === void 0 ? void 0 : _b.branchnumber) +
                    '&__RequestVerificationToken=' +
                    ((_c = this.data) === null || _c === void 0 ? void 0 : _c.__RequestVerificationToken),
            },
        };
        return returnApiRequest;
    }
}
exports.GetBranch = GetBranch;
