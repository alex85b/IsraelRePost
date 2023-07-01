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
const BadApiResponse_1 = require("../errors/BadApiResponse");
const spinNewUser = (oldUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const userCreateAnonymous = new UserCreateAnonymous_1.UserCreateAnonymous();
    const anonymousResponse = yield userCreateAnonymous.makeRequest();
    if (anonymousResponse.data.Success !== 'true') {
        throw new BadApiResponse_1.BadApiResponse({
            message: 'Success key is false',
            source: 'spinNewUser',
        });
    }
    else if (anonymousResponse.data.username === oldUsername) {
        throw new BadApiResponse_1.BadApiResponse({
            message: 'username has not changed',
            source: 'spinNewUser',
        });
    }
    return anonymousResponse;
});
exports.spinNewUser = spinNewUser;
