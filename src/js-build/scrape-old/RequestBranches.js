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
exports.requestBranches = void 0;
const load_braches_1 = require("../api-requests-old/load-braches");
const make_request_1 = require("../api-requests-old/make-request");
const requestBranches = (requestSetup) => __awaiter(void 0, void 0, void 0, function* () {
    const { cookieBank, htmlToken } = requestSetup;
    const branchesList = (yield (0, make_request_1.MakeRequest)(new load_braches_1.LoadBranchesBuilder(cookieBank.getCookies(), undefined, undefined, {
        __RequestVerificationToken: htmlToken,
    }))).data;
    console.log('### [requestBranches] Fetch all branches : Done ###');
    console.log('### [requestBranches] Dataset size before filtering ### : ', Object.keys(branchesList.branches).length);
    // Filter out the all the kiosks and shops that only offer mail pickup services.
    const filteredBranches = branchesList.branches.reduce((accumulator, branch) => {
        if (branch.qnomycode !== 0) {
            const newBranch = {
                id: branch.id,
                branchnumber: branch.branchnumber,
                branchname: branch.branchname,
                branchnameEN: branch.branchnameEN || '',
                city: branch.city,
                cityEN: branch.cityEN || '',
                street: branch.street,
                streetEN: branch.streetEN || '',
                streetcode: branch.streetcode || '',
                zip: branch.zip,
                qnomycode: branch.qnomycode,
                qnomyWaitTimeCode: branch.qnomyWaitTimeCode,
                haszimuntor: branch.haszimuntor,
                isMakeAppointment: branch.haszimuntor,
                location: {
                    // This conforms to elastic's { type: 'geo_point' } mapping upon 'location'.
                    lat: branch.geocode_latitude,
                    lon: branch.geocode_longitude,
                },
            };
            accumulator.push(newBranch);
        }
        return accumulator;
    }, []);
    console.log('### [requestBranches] Filter and transform branch-list : Done ###');
    console.log('### [requestBranches] Dataset size after filtering ### : ', Object.keys(filteredBranches).length);
    return { filteredBranches: filteredBranches };
});
exports.requestBranches = requestBranches;
