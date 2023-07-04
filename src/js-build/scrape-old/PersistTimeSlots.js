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
exports.persistTimeSlots = void 0;
const elstClient_1 = require("../elastic/elstClient");
const fs_1 = __importDefault(require("fs"));
// import dotenv from 'dotenv';
const persistTimeSlots = (branchSlots, certificatePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!branchSlots.length) {
        console.error('### [persistTimeSlots] No branches to add ###');
        return { bulkAddSlotsResponse: [] };
    }
    try {
        // const certificatePath = path.join(
        // 	__dirname,
        // 	'..',
        // 	'..',
        // 	'elastic-cert',
        // 	'http_ca.crt'
        // );
        const certificateContents = fs_1.default.readFileSync(certificatePath, 'utf8');
        const elasticClient = new elstClient_1.ElasticClient('https://127.0.0.1:9200', 'elastic', process.env.ELS_PSS || '', certificateContents, false);
        elasticClient.sendPing();
        const bulkAddSlotsResponse = yield elasticClient.bulkAddSlots(branchSlots);
        console.log('### [persistTimeSlots] bulkAddSlots : Done ###');
        return { bulkAddSlotsResponse: bulkAddSlotsResponse };
    }
    catch (error) {
        throw error;
    }
});
exports.persistTimeSlots = persistTimeSlots;
