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
exports.MakeRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const MakeRequest = (builder) => __awaiter(void 0, void 0, void 0, function* () {
    const server_response = yield axios_1.default.request(builder.buildApiRequest().config);
    let axiosCookies = [];
    if (server_response === null || server_response === void 0 ? void 0 : server_response.headers) {
        axiosCookies = server_response.headers['set-cookie'] || [];
    }
    const data = server_response.data;
    return { data, axiosCookies };
});
exports.MakeRequest = MakeRequest;