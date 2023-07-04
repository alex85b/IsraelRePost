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
exports.getBranchDetails = void 0;
const location_get_services_1 = require("../api-requests-old/location-get-services");
const make_request_1 = require("../api-requests-old/make-request");
const search_avaliable_dates_1 = require("../api-requests-old/search-avaliable-dates");
const todays_date_1 = require("../common/todays-date");
const search_available_slots_1 = require("../api-requests-old/search-available-slots");
const getBranchDetails = (branch, cookieBank, userDataToken) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id, _source } = branch;
    const { qnomycode, branchnameEN, branchnumber } = _source;
    const timeSlotsDocuments = [];
    const locationGetServices = yield (0, make_request_1.MakeRequest)(new location_get_services_1.LocationGetServices(cookieBank.getCookies(), userDataToken, {
        locationId: String(qnomycode),
        serviceTypeId: '0',
    }));
    cookieBank.importAxiosCookies(locationGetServices.axiosCookies);
    const services = locationGetServices.data.Results;
    const todaysDate = (0, todays_date_1.getTodayDateObject)();
    for (const service of services) {
        const { serviceId } = service;
        const { dates } = yield helperGetDatePerService(cookieBank, userDataToken, String(serviceId), todaysDate.year, todaysDate.month, todaysDate.day);
        if (dates === null || dates == undefined || (dates === null || dates === void 0 ? void 0 : dates.length) === 0)
            return null;
        for (const date of dates) {
            const { calendarId } = date;
            const { hours } = yield helperGetHoursPerDateService(cookieBank, userDataToken, String(serviceId), String(calendarId));
            const timeSlotsDocument = {
                branchKey: _id,
                branchDate: date.calendarDate,
                branchServiceId: 0,
                branchServiceName: '',
                timeSlots: hours,
            };
            timeSlotsDocuments.push(timeSlotsDocument);
        }
    }
    console.log(`### [getBranchDetails] Examining branch ${branchnameEN} ${branchnumber}: Done`);
    return timeSlotsDocuments;
});
exports.getBranchDetails = getBranchDetails;
const helperGetDatePerService = (cookieBank, userDataToken, serviceId, year, month, day) => __awaiter(void 0, void 0, void 0, function* () {
    const searchAvailableDates = yield (0, make_request_1.MakeRequest)(new search_avaliable_dates_1.SearchAvailableDates(cookieBank.getCookies(), userDataToken, {
        serviceId: serviceId,
        startDate: {
            yyyy: year,
            mm: month,
            dd: day,
        },
    }));
    cookieBank.importAxiosCookies(searchAvailableDates.axiosCookies);
    return {
        dates: (searchAvailableDates === null || searchAvailableDates === void 0 ? void 0 : searchAvailableDates.data).Results,
    };
});
const helperGetHoursPerDateService = (cookieBank, userDataToken, serviceId, calendarId) => __awaiter(void 0, void 0, void 0, function* () {
    const searchAvailableSlots = yield (0, make_request_1.MakeRequest)(new search_available_slots_1.SearchAvailableSlots(cookieBank.getCookies(), userDataToken, {
        dayPart: '1',
        serviceId: serviceId,
        calendarId: calendarId,
    }));
    return { hours: searchAvailableSlots.data.Results };
});
