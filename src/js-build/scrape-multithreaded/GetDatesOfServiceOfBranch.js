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
exports.getDatesOfServiceOfBranch = void 0;
const SearchAvailableDates_1 = require("../api-requests/SearchAvailableDates");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const getDatesOfServiceOfBranch = (cookies, urlAttributes, headers, useProxy, proxyUrl, proxyAuth) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchAvailableDates = new SearchAvailableDates_1.SearchAvailableDates();
        const datesResponse = yield searchAvailableDates.makeRequest(useProxy, proxyUrl, proxyAuth, {
            ARRAffinity: cookies.ARRAffinity,
            ARRAffinitySameSite: cookies.ARRAffinitySameSite,
            GCLB: cookies.GCLB,
        }, { serviceId: urlAttributes.serviceId, startDate: urlAttributes.serviceId }, { token: headers.token });
        if (datesResponse.data.Success !== 'true') {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'Success key is false',
                source: 'getDatesOfServiceOfBranch',
            });
        }
        if (datesResponse.data.TotalResults === '0' ||
            datesResponse.nested.length === 0) {
            console.error('[getDatesOfServiceOfBranch] no dates for branch-service combo');
            console.error('[getDatesOfServiceOfBranch] dates: ', datesResponse);
        }
        return datesResponse.nested;
    }
    catch (error) {
        console.error('[getDatesOfServiceOfBranch] Failed!');
        throw error;
    }
});
exports.getDatesOfServiceOfBranch = getDatesOfServiceOfBranch;
