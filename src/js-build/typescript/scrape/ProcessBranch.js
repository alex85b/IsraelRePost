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
const GetDatesOfServiceOfBranch_1 = require("./GetDatesOfServiceOfBranch");
const GetServicesOfBranch_1 = require("./GetServicesOfBranch");
const GetTimesOfDateServiceBranch_1 = require("./GetTimesOfDateServiceBranch");
const SpinNewUser_1 = require("./SpinNewUser");
const worker_threads_1 = require("worker_threads");
const SharedData_1 = require("./SharedData");
// branch: ISingleBranchQueryResponse
const processBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const { branch, proxyAuth, proxyUrl, useProxy } = worker_threads_1.workerData;
    (0, SharedData_1.setSharedData)(Math.floor(Math.random() * 301));
    const branchNumber = branch._source.branchnumber;
    const branchKey = branch._id;
    const qnomy = branch._source.qnomycode;
    const branchName = branch._source.branchnameEN;
    console.log(`[Start] branch: ${branchName} ${branchNumber}`);
    const branchServicesDatesTimes = [];
    let username = '';
    const userResponse = yield (0, SpinNewUser_1.spinNewUser)(username);
    username = userResponse.data.username;
    //* Get services.
    const services = yield (0, GetServicesOfBranch_1.getServicesOfBranch)({
        ARRAffinity: userResponse.cookies.ARRAffinity,
        ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
        CentralJWTCookie: userResponse.cookies.CentralJWTCookie,
        GCLB: userResponse.cookies.GCLB,
    }, { locationId: String(qnomy), serviceTypeId: '0' }, { token: userResponse.data.token });
    //* Get dates slots.
    for (const service of services) {
        const dates = yield (0, GetDatesOfServiceOfBranch_1.getDatesOfServiceOfBranch)({
            ARRAffinity: userResponse.cookies.ARRAffinity,
            ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
            GCLB: userResponse.cookies.GCLB,
        }, { serviceId: service.serviceId, startDate: '' }, { token: userResponse.data.token });
        for (const date of dates) {
            const times = yield (0, GetTimesOfDateServiceBranch_1.getTimesOfDateOfServiceOfBranch)({
                ARRAffinity: userResponse.cookies.ARRAffinity,
                ARRAffinitySameSite: userResponse.cookies.ARRAffinitySameSite,
                GCLB: userResponse.cookies.GCLB,
            }, {
                CalendarId: date.calendarId,
                dayPart: '0',
                ServiceId: service.serviceId,
            }, { token: userResponse.data.token });
            branchServicesDatesTimes.push({
                branchKey: branchKey,
                branchServiceId: Number.parseInt(service.serviceId),
                branchServiceName: service.serviceName,
                branchDate: date.calendarDate,
                timeSlots: times.map((time) => {
                    return { Time: Number.parseInt(time.Time) };
                }),
            });
        }
    }
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(branchServicesDatesTimes);
});
processBranch();
// module.exports = processBranch;
