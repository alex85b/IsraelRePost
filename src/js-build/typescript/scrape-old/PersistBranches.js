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
exports.persistBranches = void 0;
const elstClient_1 = require("../elastic/elstClient");
const fs_1 = __importDefault(require("fs"));
// import dotenv from 'dotenv';
const persistBranches = (doResetBranches, filteredBranches, certificatePath) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (doResetBranches) {
            yield elasticClient.deleteIndices('all');
            console.log('### [persistBranches] deleteAllIndices : Done ###');
        }
        yield elasticClient.setupIndex('branches');
        const branches = yield elasticClient.bulkAddBranches(filteredBranches);
        console.log('### [persistBranches] Done : Done ###');
        return { branches };
    }
    catch (error) {
        throw error;
    }
});
exports.persistBranches = persistBranches;
