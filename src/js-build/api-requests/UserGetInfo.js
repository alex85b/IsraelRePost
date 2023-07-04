"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGetInfo = void 0;
const BaseRequest_1 = require("./BaseRequest");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const https_proxy_agent_1 = require("https-proxy-agent");
class UserGetInfo extends BaseRequest_1.BaseApiRequest {
    constructor() {
        super();
        this.requestCookieHeaders = [
            'ARRAffinity',
            'ARRAffinitySameSite',
            'CentralJWTCookie',
            'GCLB',
        ];
        this.requestHeadersKeys = ['token'];
        this.responseDataKeys = [
            'Success',
            'username',
            'isAnonymous',
            'isExternalLogin',
            'hasSingleActiveVisitToday',
            'hasMultipleVisits',
            'visitsCount',
            'hasActiveVisits',
            'visitId',
            'smsNotificationsEnabled',
            'smsVerified',
            'token',
            'ErrorMessage',
            'ErrorNumber',
            'Messages',
        ];
        this.nameOfThis = 'UserGetInfo';
    }
    makeRequest(useProxy, proxyUrl, proxyAuth, cookies, headers) {
        return super.makeRequest(useProxy, proxyUrl, proxyAuth, cookies, undefined, headers);
    }
    buildRequest(useProxy, proxyUrl, proxyAuth, cookies, headers) {
        const requestConfig = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://central.qnomy.com/CentralAPI/UserGetInfo',
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
        if (useProxy) {
            // console.log('[UserGetInfo] [buildRequest] useProxy: ', useProxy);
            const proxyURL = new URL(proxyUrl);
            if (proxyAuth) {
                proxyURL.username = proxyAuth.username;
                proxyURL.password = proxyAuth.password;
            }
            const proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(proxyURL.toString());
            requestConfig.httpsAgent = proxyAgent;
        }
        return requestConfig;
    }
    parseResponseData(data) {
        if (!this.isApiResponse(data)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'response does not conform in format',
                source: 'UserGetInfo',
            });
        }
        return this.transformResponse(data);
    }
    isApiResponse(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return ((data === null || data === void 0 ? void 0 : data.Success) !== undefined &&
            ((_a = data === null || data === void 0 ? void 0 : data.Results) === null || _a === void 0 ? void 0 : _a.username) !== undefined &&
            ((_b = data === null || data === void 0 ? void 0 : data.Results) === null || _b === void 0 ? void 0 : _b.emaiAddress) !== undefined &&
            ((_c = data === null || data === void 0 ? void 0 : data.Results) === null || _c === void 0 ? void 0 : _c.isAnonymous) !== undefined &&
            ((_d = data === null || data === void 0 ? void 0 : data.Results) === null || _d === void 0 ? void 0 : _d.isExternalLogin) !== undefined &&
            ((_e = data === null || data === void 0 ? void 0 : data.Results) === null || _e === void 0 ? void 0 : _e.hasSingleActiveVisitToday) !== undefined &&
            ((_f = data === null || data === void 0 ? void 0 : data.Results) === null || _f === void 0 ? void 0 : _f.hasMultipleVisits) !== undefined &&
            ((_g = data === null || data === void 0 ? void 0 : data.Results) === null || _g === void 0 ? void 0 : _g.hasActiveVisits) !== undefined &&
            ((_h = data === null || data === void 0 ? void 0 : data.Results) === null || _h === void 0 ? void 0 : _h.visitId) !== undefined &&
            ((_j = data === null || data === void 0 ? void 0 : data.Results) === null || _j === void 0 ? void 0 : _j.smsNotificationsEnabled) !== undefined &&
            ((_k = data === null || data === void 0 ? void 0 : data.Results) === null || _k === void 0 ? void 0 : _k.smsVerified) !== undefined &&
            ((_l = data === null || data === void 0 ? void 0 : data.Results) === null || _l === void 0 ? void 0 : _l.phoneMask) !== undefined &&
            ((_m = data === null || data === void 0 ? void 0 : data.Results) === null || _m === void 0 ? void 0 : _m.smsVerified) !== undefined &&
            ((_o = data === null || data === void 0 ? void 0 : data.Results) === null || _o === void 0 ? void 0 : _o.token) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Page) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ResultsPerPage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.TotalResults) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorMessage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorNumber) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Messages) !== undefined);
    }
}
exports.UserGetInfo = UserGetInfo;
