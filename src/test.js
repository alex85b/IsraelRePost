console.log('### Initiate Tests of IsraelRePost ###');

// ##############################################################################################
// ### Test Counters (Atomic and Mutex protected) And Request Limiters ##########################
// ##############################################################################################

/*
The concept of Mutex as a "Request batch limiter"*/
// ###############################################
// ###############################################
// const { testMutexCounter } = require('./js-build/test/async-mutex/base-mutex/TestAsyncMutex');

// testMutexCounter(false);

// ##############################################################################################
// ### New Messaging Concept ####################################################################
// ##############################################################################################

// const {
// 	testHandlersAsStringType,
// 	testHandlersAsEnums,
// 	testHandlersEnumsAndFunctions,
// } = require('./js-build/test/messaging/handlers/HandlerFunctionConcept');
// testHandlersAsStringType(false);
// testHandlersAsEnums(false);
// testHandlersEnumsAndFunctions(false);

// ##############################################################################################
// ### Elastic APIs #############################################################################
// ##############################################################################################

/*
Basic Elasticsearch 'Client' for communication using https*/
// #########################################################
// #########################################################
// const {
// 	createIndex,
// 	getIndexMapping,
// 	getInstance,
// 	negativePingIndex,
// 	positivePingIndex,
// 	searchIndex,
// 	addUpdateRecord,
// 	deleteIndex,
// 	bulkAdd,
// 	deleteRecordsByQ,
// 	updateRecordByQ,
// } = require('./js-build/test/api/elastic/base/TestElasticsearchClient');
// /* This class has more abilities that are not tested directly */

// getInstance();
// createIndex();
// getIndexMapping();
// deleteIndex();
// negativePingIndex();
// positivePingIndex();
// searchIndex();
// addUpdateRecord();
// bulkAdd();
// deleteRecordsByQ();
// updateRecordByQ();

/*
Queries that are specific to 'Branch' index*/
// ##########################################
// ##########################################

// const {
// 	construct: branchConstruct,
// 	fetchAllBranches,
// 	branchesWithoutServices,
// 	getBranchesExcluding,
// 	bulkAddBranches,
// 	updateBranchServices,
// 	fetchAllQnomyCodes,
// 	createBranchIndex,
// 	deleteAllBranches,
// 	deleteBranchIndex,
// } = require('./js-build/test/api/elastic/TestBranchServicesIndexing');

// branchConstruct();
// fetchAllBranches();
// branchesWithoutServices();
// getBranchesExcluding();
// bulkAddBranches();
// updateBranchServices();
// fetchAllQnomyCodes();
// createBranchIndex();
// deleteAllBranches();
// deleteBranchIndex();

/*
Queries that are specific to 'Errors' index*/
// ##########################################
// ##########################################

// const {
// 	construct: errorsConstruct,
// 	fetchAllErrors,
// 	updateAddError,
// 	deleteAllErrors,
// } = require('./js-build/test/api/elastic/TestUpdateErrorIndexing');

// errorsConstruct();
// fetchAllErrors();
// updateAddError();
// deleteAllErrors();

// ##############################################################################################
// ### Redis Cloud APIs #########################################################################
// ##############################################################################################

/*
Basic Redis Cloud Queue Client*/
// #############################
// #############################
// const {
// 	deserializeItems,
// 	getRedisCloudData,
// } = require('./js-build/test/api/redisCloud/base/TestRedisQueueUtils');
// getRedisCloudData();
// deserializeItems();

// const {
// 	construct: constructRedisQueue,
// 	enqueue,
// 	dequeue,
// 	exists,
// 	bEnqueue,
// 	bDequeueAll,
// 	qSize,
// } = require('./js-build/test/api/redisCloud/base/TestRedisQueueClient');
// constructRedisQueue();
// enqueue();
// dequeue();
// exists();
// bEnqueue();
// bDequeueAll();
// qSize();

// ##############################################################################################
// ### Israel Post API Requests  ################################################################
// ##############################################################################################

// const {
// 	buildAndPerformUserRequest,
// } = require('./js-build/test/api/postOfficeCalls/base/TestBaseApiCall');
// buildAndPerformUserRequest();

// const {
// 	multipleConfigBuildsInSingleRun,
// } = require('./js-build/test/api/postOfficeCalls/TestBuildCallConfigurations');
// multipleConfigBuildsInSingleRun();

// const {
// 	makeUserRequest,
// 	makeUserRequestWithProxy,
// } = require('./js-build/test/api/postOfficeCalls/requestConfigs/TestCreateUserConfig');
// makeUserRequest();
// makeUserRequestWithProxy();

// const {
// 	makeServicesRequest,
// 	makeServicesRequestWithProxy,
// } = require('./js-build/test/api/postOfficeCalls/requestConfigs/TestFetchServicesConfig');
// makeServicesRequest();
// makeServicesRequestWithProxy();

// const {
// 	makeDatesRequest,
// 	makeDatesRequestWithProxy,
// } = require('./js-build/test/api/postOfficeCalls/requestConfigs/TestFetchDatesConfig');
// makeDatesRequest();
// makeDatesRequestWithProxy();

// const {
// 	makeTimesRequest,
// 	makeTimesRequestWithProxy,
// } = require('./js-build/test/api/postOfficeCalls/requestConfigs/TestFetchTimesConfig');
// makeTimesRequest();
// makeTimesRequestWithProxy();

// ##############################################################################################
// ### Repositories #############################################################################
// ##############################################################################################

// const {
// 	getAllBranches,
// 	getAllBranchesIdAndQnomyCode,
// 	getAllBranchesIdAndQnomyCodeExcluding,
// 	testUpdateBranchServices,
// } = require('./js-build/test/data/repositories/TestPostofficeBranchesRepository');
// getAllBranches();
// getAllBranchesIdAndQnomyCode();
// getAllBranchesIdAndQnomyCodeExcluding();
// testUpdateBranchServices();

// const {
// 	getAllErrors,
// 	addUpdateErrorRecord,
// } = require('./js-build/test/data/repositories/TestUpdateErrorRecordsRepository');
// getAllErrors();
// addUpdateErrorRecord();

// const {
// 	replaceUnprocessedQueue,
// 	popPushPair,
// 	popAllPairs,
// } = require('./js-build/test/data/repositories/TestPostofficeCodeIdPairsRepository');
// replaceUnprocessedQueue();
// popPushPair();
// popAllPairs();

// ##############################################################################################
// ### Models ###################################################################################
// ##############################################################################################
// const {
// 	constructNewServiceRecord,
// 	useServiceRecord,
// } = require('./js-build/test/data/models/persistenceModels/TestPostofficeBranchServices');
// constructNewServiceRecord();
// useServiceRecord();

// const {
// 	useErrorRecord,
// 	testUserErrorConstruction,
// 	testServiceErrorConstruction,
// 	testDatesErrorConstruction,
// 	testTimesErrorConstruction,
// } = require('./js-build/test/data/models/persistenceModels/TestUpdateErrorRecord');
// useErrorRecord();
// testUserErrorConstruction();
// testServiceErrorConstruction();
// testDatesErrorConstruction();
// testTimesErrorConstruction();

// const {
// 	endpointProxiesStrings,
// } = require('./js-build/test/data/models/dataTransferModels/TestProxyEndpointString');
// endpointProxiesStrings();

// ##############################################################################################
// ### Services  ################################################################################
// ##############################################################################################

// const {
// 	newPage,
// 	browserPage,
// } = require('./js-build/test/services/scrape/base/TestPuppeteerClient');
// newPage();
// browserPage();

const { testScrapeXhrObjects } = require('./js-build/test/services/scrape/TestScrapeBranches');
// testScrapeXhrObjects();

const {
	testFilterByMakeAppointments,
} = require('./js-build/test/services/scrape/TestFilterBranches');
// testFilterByMakeAppointments();

const {
	testDeleteAddBranches,
	testAddUpdateBranches,
} = require('./js-build/test/services/TestUpdateBranches');
// testDeleteAddBranches();
// testAddUpdateBranches();

const {
	testWorkerWrapper,
} = require('./js-build/test/services/updateAppointments/helpers/threadCommunication/TestCommunicationWrappers');
// testWorkerWrapper();

const {
	constructNewMemoryView,
	checkIfMemoryView,
} = require('./js-build/test/data/models/dataTransferModels/TestThreadSharedMemory');
// constructNewMemoryView();
// checkIfMemoryView();

const {
	testSetCellValue,
	testReplaceExpectedValue,
	testAddToCellValue,
} = require('./js-build/test/services/updateAppointments/helpers/concurrency/TestAtomicArrayWriter');
// testSetCellValue();
// testReplaceExpectedValue();
// testAddToCellValue();

const {
	testSingleThreadTracking,
	testMultiThreadedTracking,
	testLimitReset,
} = require('./js-build/test/services/updateAppointments/helpers/consumptionTracker/TestRequestTracker');
// testSingleThreadTracking();
// testMultiThreadedTracking();
// testLimitReset();

const {
	testBuildMutexRequestsBatchTracker,
} = require('./js-build/test/services/updateAppointments/helpers/consumptionTracker/TestRequestsBatchTracker');
// testBuildMutexRequestsBatchTracker();

const {
	rePopulateUnprocessed,
} = require('./js-build/test/services/updateAppointments/helpers/TestPopulateRedisQueue');
// rePopulateUnprocessed();

const {
	testCreateUserNode,
	testFetchServicesNode,
	testFetchDatesNode,
	testFetchTimesNode,
	testCreateUserNodeUsingProxy,
	testFetchServicesNodeUsingProxy,
	testFetchDatesNodeUsingProxy,
	testFetchTimesNodeUsingProxy,
} = require('./js-build/test/services/updateAppointments/helpers/updateServicesRecord/TestPostofficeRequestNodes');
// testCreateUserNode();
// testFetchServicesNode();
// testFetchDatesNode();
// testFetchTimesNode();
// testCreateUserNodeUsingProxy();
// testFetchServicesNodeUsingProxy();
// testFetchDatesNodeUsingProxy();
// testFetchTimesNodeUsingProxy();

const {
	testDepleteContinue,
	testDepleteContinueUseProxy,
} = require('./js-build/test/services/updateAppointments/helpers/updateServicesRecord/TestConstructServicesRecord');
// testDepleteContinue();
// testDepleteContinueUseProxy();

const {
	testSingleThreadedDepletedTracker,
	testMultiThreadedDepletedTracker,
} = require('./js-build/test/services/updateAppointments/helpers/claimTracker/TestDepletedClaimTracker');
// testSingleThreadedDepletedTracker();
// testMultiThreadedDepletedTracker();

const {
	testHandleStartUpdate,
	testHandleStartUpdateUseProxy,
	testStartUpdateThenStop,
	testStartUpdateThenEndUpdater,
	testStartUpdateThenContinue,
} = require('./js-build/test/services/updateAppointments/workerThreads/appointmentsUpdater/TestMessageHandlers');
// testHandleStartUpdate();
// testHandleStartUpdateUseProxy();
// testStartUpdateThenStop(true);
// testStartUpdateThenEndUpdater(true);
// testStartUpdateThenContinue(true);

const {
	testHandleStartEndpoint,
} = require('./js-build/test/services/updateAppointments/workerThreads/ipManager/TestMessageHandler');
testHandleStartEndpoint();

// ##############################################################################################
// ### Shared  ##################################################################################
// ##############################################################################################

/*
Functions*/
const { testReadExisting } = require('./js-build/test/shared/functions/TestReadEnv');
// testReadExisting();

const {
	testReadSmartProxyFile,
	testReadWebShareFile,
} = require('./js-build/test/shared/functions/TestReadTextFile');
// testReadSmartProxyFile();
// testReadWebShareFile();
