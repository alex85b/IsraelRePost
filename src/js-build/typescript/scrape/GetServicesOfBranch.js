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
exports.getServicesOfBranch = void 0;
const LocationGetServices_1 = require("../api-requests/LocationGetServices");
const BadApiResponse_1 = require("../errors/BadApiResponse");
const getServicesOfBranch = (cookies, urlAttributes, headers) => __awaiter(void 0, void 0, void 0, function* () {
    const locationGetServices = new LocationGetServices_1.LocationGetServices();
    const servicesResponse = yield locationGetServices.makeRequest({
        ARRAffinity: cookies.ARRAffinity,
        ARRAffinitySameSite: cookies.ARRAffinitySameSite,
        CentralJWTCookie: cookies.CentralJWTCookie,
        GCLB: cookies.GCLB,
    }, {
        locationId: urlAttributes.locationId,
        serviceTypeId: urlAttributes.serviceTypeId,
    }, { token: headers.token });
    if (servicesResponse.data.Success !== 'true') {
        throw new BadApiResponse_1.BadApiResponse({
            message: 'Success key is false',
            source: 'getServicesOfBranch',
        });
    }
    if (servicesResponse.data.TotalResults === '0' ||
        servicesResponse.nested.length === 0) {
        console.error('[getServicesOfBranch] no services for the branch');
    }
    return servicesResponse.nested;
});
exports.getServicesOfBranch = getServicesOfBranch;
