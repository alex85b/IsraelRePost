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
exports.ElasticClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const elst_malfunction_error_1 = require("../errors/elst-malfunction-error");
const bulk_edit_error_1 = require("../errors/bulk-edit-error");
/*
    This encapsulates all the logic that connected to Elasticsearch requests,
    Implements needed CRUD operations on the 'all-branches' and 'appointments' indices.
*/
class ElasticClient {
    // Construct client.
    constructor(node, username, password, caCertificate, rejectUnauthorized) {
        //
        // This will be used to send requests to Elasticsearch.
        this.client = null;
        // Hardcoded indices.
        this.branchesIndex = 'all-post-branches';
        this.slotsIndex = 'open-slots';
        // Hardcoded branches mapping.
        this.branchesMapping = {
            dynamic: 'strict',
            properties: {
                id: { type: 'integer' },
                branchnumber: { type: 'integer' },
                branchname: { type: 'text' },
                branchnameEN: { type: 'text' },
                city: { type: 'text' },
                cityEN: { type: 'text' },
                street: { type: 'text' },
                streetEN: { type: 'text' },
                streetcode: { type: 'keyword' },
                zip: { type: 'keyword' },
                qnomycode: { type: 'integer' },
                qnomyWaitTimeCode: { type: 'integer' },
                haszimuntor: { type: 'integer' },
                isMakeAppointment: { type: 'integer' },
                location: { type: 'geo_point' },
            },
        };
        // Hardcoded time slots mapping.
        this.timeSlotsMapping = {
            dynamic: 'strict',
            properties: {
                id: { type: 'text' },
                calendarDate: { type: 'date', format: "yyyy-MM-dd'T'HH:mm:ss" },
                time: { type: 'integer' },
            },
        };
        // Hardcoded settings.
        this.settings = {
            number_of_shards: 1,
            number_of_replicas: 1,
        };
        this.client = new elasticsearch_1.Client({
            node: node,
            auth: {
                username: username || 'elastic',
                password: password,
            },
            tls: {
                ca: caCertificate,
                rejectUnauthorized: rejectUnauthorized,
            },
        });
    }
    sendPing() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.ping());
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError('sendPing failed');
            }
        });
    }
    createIndex(indexName, settings, mappings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.indices.create({
                    index: indexName,
                    body: {
                        settings,
                        mappings,
                    },
                }));
                return result || false;
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError(`createIndex failed: ${indexName}`);
            }
        });
    }
    setupIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            if (index === 'all') {
                if (!(yield this.indexExists('branches')))
                    this.createAllBranchesIndex;
                if (!(yield this.indexExists('slots')))
                    this.createTimeSlotsIndex;
            }
            else if (index === 'slots') {
                if (!(yield this.indexExists('slots')))
                    this.createTimeSlotsIndex;
            }
            else {
                if (!(yield this.indexExists('branches')))
                    this.createAllBranchesIndex;
            }
        });
    }
    indexExists(index) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const checkThis = index === 'branches' ? this.branchesIndex : this.slotsIndex;
            try {
                const response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.indices.exists({ index: checkThis }));
                return response || false;
            }
            catch (error) {
                throw new elst_malfunction_error_1.ElasticMalfunctionError(`indexExists failed: ${index}`);
            }
        });
    }
    createAllBranchesIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            try {
                response = yield this.createIndex(this.branchesIndex, this.settings, this.branchesMapping);
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError('createAllBranchesIndex failed creation');
            }
            if (!response || !response.acknowledged) {
                throw new elst_malfunction_error_1.ElasticMalfunctionError('createAllBranchesIndex response failure');
            }
            return true;
        });
    }
    createTimeSlotsIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            try {
                response = yield this.createIndex(this.slotsIndex, this.settings, this.timeSlotsMapping);
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError('createTimeSlotsIndex failed creation');
            }
            if (!response || !response.acknowledged) {
                throw new elst_malfunction_error_1.ElasticMalfunctionError('createTimeSlotsIndex response failure');
            }
            return true;
        });
    }
    deleteIndices(index) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const deleteThis = index === 'branches'
                ? this.branchesIndex
                : index === 'slots'
                    ? this.slotsIndex
                    : '*';
            try {
                const response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.indices.getAlias({ index: deleteThis }));
                if (!response)
                    return false;
                for (const ind in response) {
                    if (ind !== '.security-7') {
                        const response = yield ((_b = this.client) === null || _b === void 0 ? void 0 : _b.indices.delete({ index: ind }));
                        console.log(`Index '${ind}' has been deleted: `, response);
                    }
                }
                return true;
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError(`deleteIndices ${index} failed deletion`);
            }
        });
    }
    addBranch(document) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.index({
                    index: this.branchesIndex,
                    document: document,
                }));
            }
            catch (error) {
                console.error(error.message);
                throw new elst_malfunction_error_1.ElasticMalfunctionError(`addBranch failed: ${document}`);
            }
        });
    }
    getAllBranches() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.search({
                index: this.branchesIndex,
                query: {
                    match_all: {},
                },
                size: 2000,
            }));
            if (response)
                return response;
            throw new elst_malfunction_error_1.ElasticMalfunctionError('getAllBranches failed fetch');
        });
    }
    bulkAddBranches(addBranches) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const body = addBranches.flatMap((object) => [
                { index: { _index: this.branchesIndex } },
                object,
            ]);
            let response;
            try {
                response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.bulk({ body }));
                console.log('### [bulkAddBranches] has error ### : ', response === null || response === void 0 ? void 0 : response.errors);
                if (!response) {
                    throw new elst_malfunction_error_1.ElasticMalfunctionError('Bulk add has failed');
                }
            }
            catch (error) {
                console.error(error);
                throw new elst_malfunction_error_1.ElasticMalfunctionError(error.message);
            }
            if (response.errors) {
                const errors = [];
                for (const item of response.items) {
                    errors.push({
                        message: String(((_c = (_b = item.index) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.reason) || ''),
                        source: String(((_e = (_d = item.index) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.caused_by) || ''),
                    });
                }
                throw new bulk_edit_error_1.BulkAddError(errors);
            }
            return response === null || response === void 0 ? void 0 : response.items;
        });
    }
    bulkAddSlots(addTimeSlots) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const body = addTimeSlots.flatMap((document) => document.timeSlots.map((timeSlot) => ({
                index: { _index: this.slotsIndex },
                branchKey: document.branchKey,
                BranchDate: document.branchDate,
                Time: timeSlot.Time,
            })));
            let response;
            try {
                response = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.bulk({ body }));
                console.log('### [bulkAddSlots] has error ### : ', response === null || response === void 0 ? void 0 : response.errors);
                if (!response) {
                    throw new elst_malfunction_error_1.ElasticMalfunctionError('Bulk add has failed');
                }
            }
            catch (error) {
                console.error(error);
                throw new elst_malfunction_error_1.ElasticMalfunctionError(error.message);
            }
            if (response.errors) {
                const errors = [];
                for (const item of response.items) {
                    errors.push({
                        message: String(((_c = (_b = item.index) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.reason) || ''),
                        source: String(((_e = (_d = item.index) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.caused_by) || ''),
                    });
                }
                throw new bulk_edit_error_1.BulkAddError(errors);
            }
            return response === null || response === void 0 ? void 0 : response.items;
        });
    }
    TEST_BranchSpatialIndexing(latitude, longitude) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const distance = '1km'; // Distance in kilometers
            /* ############################################################ */
            /* ### Queries ################################################ */
            /* ############################################################ */
            const spatialQuery = {
                geo_distance: {
                    distance: distance,
                    location: {
                        lat: latitude,
                        lon: longitude,
                    },
                },
            };
            const flatQuery = {
                match: {
                    cityEN: 'Zohar',
                },
            };
            /*
            //* 'Complex' strings.
            const queryStringQuery: QueryDslQueryContainer = {
                query_string: {
                    default_field: 'cityEN',
                    query: 'Zohar',
                },
            };
    
            //* Strings.
            const matchQuery: QueryDslQueryContainer = {
                match: {
                    cityEN: 'Zohar',
                },
            };
    
            //* Exact match or bust, good foe keyword type and numbers.
            const termQuery: QueryDslQueryContainer = {
                term: {
                    cityEN: 'Zohar',
                },
            };
            */
            try {
                /* ############################################################ */
                /* ### Make Queries ########################################### */
                /* ############################################################ */
                const spatialResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.search({
                    index: this.branchesIndex,
                    query: spatialQuery,
                    size: 330,
                    explain: true,
                }));
                const flatResponse = yield ((_b = this.client) === null || _b === void 0 ? void 0 : _b.search({
                    index: this.branchesIndex,
                    query: flatQuery,
                    size: 330,
                    explain: true,
                }));
                /* ############################################################ */
                /* ### Log Query Result ####################################### */
                /* ############################################################ */
                console.log('spatialResponse?.hits : ', spatialResponse === null || spatialResponse === void 0 ? void 0 : spatialResponse.hits);
                console.log('flatResponse?.hits : ', flatResponse === null || flatResponse === void 0 ? void 0 : flatResponse.hits);
                spatialResponse === null || spatialResponse === void 0 ? void 0 : spatialResponse.hits.hits.forEach((hit) => console.log('spatialResponse hit: ', hit));
                flatResponse === null || flatResponse === void 0 ? void 0 : flatResponse.hits.hits.forEach((hit) => console.log('flatResponse hit: ', hit));
                const spatialExecutionTime = spatialResponse === null || spatialResponse === void 0 ? void 0 : spatialResponse.took;
                const flatExecutionTime = flatResponse === null || flatResponse === void 0 ? void 0 : flatResponse.took;
                console.log('Spatial Query Execution Time:', spatialExecutionTime, 'ms');
                console.log('Flat Query Execution Time:', flatExecutionTime, 'ms');
            }
            catch (error) {
                console.error('Error:', error);
            }
        });
    }
}
exports.ElasticClient = ElasticClient;
