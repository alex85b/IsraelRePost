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
exports.SetUpElasticClient = void 0;
const elstClient_1 = require("../elastic/elstClient");
const SetUpElasticClient = (resetIndex, certificates) => __awaiter(void 0, void 0, void 0, function* () {
    // const certificatePath = path.join(
    // 	__dirname,
    // 	'..',
    // 	'..',
    // 	'elastic-cert',
    // 	'http_ca.crt'
    // );
    const elasticClient = new elstClient_1.ElasticClient('https://127.0.0.1:9200', 'elastic', process.env.ELS_PSS || '', certificates, false);
    elasticClient.sendPing();
    if (resetIndex !== 'none') {
        if (yield elasticClient.indexExists(resetIndex)) {
            yield elasticClient.deleteIndices(resetIndex);
            yield elasticClient.setupIndex(resetIndex);
        }
        else
            yield elasticClient.setupIndex(resetIndex);
    }
    return elasticClient;
});
exports.SetUpElasticClient = SetUpElasticClient;
