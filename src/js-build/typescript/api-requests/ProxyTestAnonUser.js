"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");
/**
 * Build a test axios config to make request using proxy.
 * @param proxyUrl Type: string | null
 * @param proxyAuth Type: { username: string; password: string } | null
 * @returns Type: AxiosRequestConfig<any>
 */
const buildRequest = (proxyUrl, proxyAuth) => {
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
    if (proxyUrl) {
        const proxyURL = new URL(proxyUrl);
        if (proxyAuth) {
            proxyURL.username = proxyAuth.username;
            proxyURL.password = proxyAuth.password;
        }
        const proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(proxyURL.toString());
        requestConfig.httpsAgent = proxyAgent;
    }
    return requestConfig;
};
/**
 * Make a test request using proxy.
 * @param proxyUrl Type: string | null
 * @param proxyAuth Type: { username: string; password: string } | null
 * @returns Type: AxiosResponse<any, any>
 */
const makeRequest = (proxyUrl, proxyAuth) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const config = buildRequest(proxyUrl, proxyAuth);
    const result = yield axios_1.default.request(config);
    // Retrieve the IP address from the response headers
    const ipAddress = result.headers['x-your-real-ip'] ||
        result.headers['x-forwarded-for'] ||
        result.headers['x-client-ip'];
    console.log('[makeRequest] [ipAddress]: ', ipAddress);
    // Check the response headers for the proxy information
    console.log('[makeRequest] Proxy Information:');
    console.log('Proxy URL:', (_c = (_b = (_a = result.config) === null || _a === void 0 ? void 0 : _a.httpsAgent) === null || _b === void 0 ? void 0 : _b.proxy) === null || _c === void 0 ? void 0 : _c.origin);
    console.log('Proxy Username:', (_f = (_e = (_d = result.config) === null || _d === void 0 ? void 0 : _d.httpsAgent) === null || _e === void 0 ? void 0 : _e.proxy) === null || _f === void 0 ? void 0 : _f.username);
    console.log('Proxy Password:', (_j = (_h = (_g = result.config) === null || _g === void 0 ? void 0 : _g.httpsAgent) === null || _h === void 0 ? void 0 : _h.proxy) === null || _j === void 0 ? void 0 : _j.password);
    return result.data;
});
module.exports = { buildRequest, makeRequest };
