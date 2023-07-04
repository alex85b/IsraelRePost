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
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinNewUser = void 0;
const UserCreateAnonymous_1 = require("../api-requests/UserCreateAnonymous");
const StringFieldExistNonEmpty_1 = require("../common/StringFieldExistNonEmpty");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const spinNewUser = (useProxy, proxyUrl, proxyAuth) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        // console.log('[spinNewUser] [proxyUrl]: ', proxyUrl);
        // console.log('[spinNewUser] [proxyAuth]: ', proxyAuth);
        const userCreateAnonymous = new UserCreateAnonymous_1.UserCreateAnonymous();
        const anonymousResponse = yield userCreateAnonymous.makeRequest(useProxy, proxyUrl, proxyAuth);
        if (((_a = anonymousResponse.data) === null || _a === void 0 ? void 0 : _a.Success) !== 'true') {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'Success key is false',
                source: 'spinNewUser',
            });
        }
        if (!(0, StringFieldExistNonEmpty_1.stringFieldExistNonEmpty)((_b = anonymousResponse.data) === null || _b === void 0 ? void 0 : _b.token)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'Html token is invalid',
                source: 'spinNewUser',
            });
        }
        if (!(0, StringFieldExistNonEmpty_1.stringFieldExistNonEmpty)((_c = anonymousResponse.cookies) === null || _c === void 0 ? void 0 : _c.ARRAffinity)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'ARRAffinity cookie is invalid',
                source: 'spinNewUser',
            });
        }
        if (!(0, StringFieldExistNonEmpty_1.stringFieldExistNonEmpty)((_d = anonymousResponse.cookies) === null || _d === void 0 ? void 0 : _d.ARRAffinitySameSite)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'ARRAffinitySameSite cookie is invalid',
                source: 'spinNewUser',
            });
        }
        if (!(0, StringFieldExistNonEmpty_1.stringFieldExistNonEmpty)((_e = anonymousResponse.cookies) === null || _e === void 0 ? void 0 : _e.CentralJWTCookie)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'CentralJWTCookie cookie is invalid',
                source: 'spinNewUser',
            });
        }
        if (!(0, StringFieldExistNonEmpty_1.stringFieldExistNonEmpty)((_f = anonymousResponse.cookies) === null || _f === void 0 ? void 0 : _f.GCLB)) {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'GCLB cookie is invalid',
                source: 'spinNewUser',
            });
        }
        return anonymousResponse;
    }
    catch (error) {
        console.error('[spinNewUser] Failed!');
        throw error;
    }
});
exports.spinNewUser = spinNewUser;
