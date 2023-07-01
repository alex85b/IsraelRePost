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
exports.queryAllBranches = void 0;
const elstClient_1 = require("../elastic/elstClient");
const elst_malfunction_error_1 = require("../errors/elst-malfunction-error");
const NotProvided_1 = require("../errors/NotProvided");
const queryAllBranches = (certificateContents) => __awaiter(void 0, void 0, void 0, function* () {
    //Calculate path to certificates.
    // const certificatePath = path.join(
    // 	__dirname,
    // 	'..',
    // 	'..',
    // 	'elastic-cert',
    // 	'http_ca.crt'
    // );
    // const certificateContents = fs.readFileSync(certificatePath, 'utf8');
    // console.log('[queryAllBranches] Fetch certificates : Done');
    // Create a client.
    const elasticClient = new elstClient_1.ElasticClient('https://127.0.0.1:9200', 'elastic', process.env.ELS_PSS || '', certificateContents, false);
    elasticClient.sendPing();
    console.log('[queryAllBranches] Elastic is up and running');
    if (!(yield elasticClient.indexExists('branches')))
        throw new elst_malfunction_error_1.ElasticMalfunctionError('all-post-branches index does not exist');
    const branches = yield elasticClient.getAllBranches();
    console.log('[queryAllBranches] search all branches : Done');
    const resultsAmount = branches.hits.total.value;
    if (resultsAmount === 0)
        throw new NotProvided_1.NotProvided({
            message: 'query did not provide results',
            source: 'getAllBranches',
        });
    const results = branches.hits.hits;
    return { allBranches: results };
});
exports.queryAllBranches = queryAllBranches;
