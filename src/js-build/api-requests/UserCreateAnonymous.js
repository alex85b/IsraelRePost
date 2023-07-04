"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCreateAnonymous = void 0;
const BaseRequest_1 = require("./BaseRequest");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const https_proxy_agent_1 = require("https-proxy-agent");
class UserCreateAnonymous extends BaseRequest_1.BaseApiRequest {
    constructor() {
        super();
        this.responseCookieHeaders = [
            'CentralJWTCookie',
            'ARRAffinity',
            'ARRAffinitySameSite',
            'GCLB',
        ];
        this.responseDataKeys = [
            'Success',
            'token',
            'username',
            'ErrorMessage',
            'Messages',
        ];
        this.nameOfThis = 'UserCreateAnonymous';
    }
    makeRequest(useProxy, proxyUrl, proxyAuth) {
        return super.makeRequest(useProxy, proxyUrl, proxyAuth);
    }
    buildRequest(useProxy, proxyUrl, proxyAuth) {
        const requestConfig = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://central.qnomy.com/CentralAPI/UserCreateAnonymous',
            headers: {
                authority: 'central.qnomy.com',
                accept: 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'he-IL,he;q=0.9',
                'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
                'application-name': 'PostIL',
                authorization: 'JWT null',
                origin: 'https://israelpost.co.il',
                'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            },
        };
        if (useProxy) {
            // console.log('[UserCreateAnonymous] [buildRequest] useProxy: ', useProxy);
            const proxyURL = new URL(proxyUrl);
            if (proxyAuth) {
                proxyURL.username = proxyAuth.username;
                proxyURL.password = proxyAuth.password;
            }
            const proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(proxyURL.toString());
            requestConfig.httpsAgent = proxyAgent;
            // console.log(
            // 	'[UserCreateAnonymous] [buildRequest] request config: ',
            // 	requestConfig
            // );
        }
        return requestConfig;
    }
    parseResponseData(data) {
        if (!this.isApiResponse(data))
            throw new BadApiResponse_1.BadApiResponse({
                message: 'response does not conform in format',
                source: 'UserCreateAnonymous',
            });
        const transformed = this.transformResponse(data);
        return transformed;
    }
    isApiResponse(data) {
        var _a, _b;
        return ((data === null || data === void 0 ? void 0 : data.Success) !== undefined &&
            ((_a = data === null || data === void 0 ? void 0 : data.Results) === null || _a === void 0 ? void 0 : _a.token) !== undefined &&
            ((_b = data === null || data === void 0 ? void 0 : data.Results) === null || _b === void 0 ? void 0 : _b.username) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Page) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ResultsPerPage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.TotalResults) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorMessage) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.ErrorNumber) !== undefined &&
            (data === null || data === void 0 ? void 0 : data.Messages) !== undefined);
    }
}
exports.UserCreateAnonymous = UserCreateAnonymous;
