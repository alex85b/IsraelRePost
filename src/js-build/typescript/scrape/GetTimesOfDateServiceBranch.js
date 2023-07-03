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
exports.getTimesOfDateOfServiceOfBranch = void 0;
const SearchAvailableSlots_1 = require("../api-requests/SearchAvailableSlots");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const SharedData_1 = require("./SharedData");
const getTimesOfDateOfServiceOfBranch = (cookies, urlAttributes, headers) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[getTimesOfDateOfServiceOfBranch] Shared data Test:', (0, SharedData_1.getSharedData)());
    const searchAvailableSlots = new SearchAvailableSlots_1.SearchAvailableSlots();
    try {
        const hoursResponse = yield searchAvailableSlots.makeRequest({
            ARRAffinity: cookies.ARRAffinity,
            ARRAffinitySameSite: cookies.ARRAffinitySameSite,
            GCLB: cookies.GCLB,
        }, {
            CalendarId: urlAttributes.CalendarId,
            dayPart: urlAttributes.dayPart,
            ServiceId: urlAttributes.ServiceId,
        }, { token: headers.token });
        if (hoursResponse.data.Success !== 'true') {
            throw new BadApiResponse_1.BadApiResponse({
                message: 'Success key is false',
                source: 'getTimesOfDateOfServiceOfBranch',
            });
        }
        if (hoursResponse.data.TotalResults === '0' ||
            hoursResponse.nested.length === 0) {
            console.error('[getTimesOfDateOfServiceOfBranch] no times for branch-service-date combo');
        }
        return hoursResponse.nested;
    }
    catch (error) {
        console.error('[getTimesOfDateOfServiceOfBranch] Failed!');
        console.log(error);
        throw error;
    }
});
exports.getTimesOfDateOfServiceOfBranch = getTimesOfDateOfServiceOfBranch;
