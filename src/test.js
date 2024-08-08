console.log("### Initiate Tests of IsraelRePost ###");

// ##############################################################################################
// ### Elastic APIs #############################################################################
// ##############################################################################################

// Basic Elasticsearch 'Client' for communication using https
// ##########################################################
// ##########################################################
/*
const {
	createIndex,
	getIndexMapping,
	getInstance,
	negativePingIndex,
	positivePingIndex,
	searchIndex,
	addUpdateRecord,
	deleteIndex,
	bulkAdd,
	deleteRecordsByQ,
	updateRecordByQ,
} = require('./js-build/api/elastic/base/Tests/ElasticsearchClient');
 */

/* This class has more abilities that are not tested directly */

/*
getInstance();
createIndex();
getIndexMapping();
deleteIndex();
negativePingIndex();
positivePingIndex();
searchIndex();
addUpdateRecord();
bulkAdd();
deleteRecordsByQ();
updateRecordByQ();
*/

// Queries that are specific to 'Branch' index
// ###########################################
// ###########################################

/*
const {
	construct: branchConstruct,
	fetchAllBranches,
	branchesWithoutServices,
	getBranchesExcluding,
	bulkAddBranches,
	updateBranchServices,
	fetchAllQnomyCodes,
	createBranchIndex,
	deleteAllBranches,
	deleteBranchIndex,
} = require('./js-build/api/elastic/branchServices/Tests/BranchServicesIndexing');
*/

/*
branchConstruct();
fetchAllBranches();
branchesWithoutServices();
getBranchesExcluding();
bulkAddBranches();
updateBranchServices();
fetchAllQnomyCodes();
createBranchIndex();
deleteAllBranches();
deleteBranchIndex();
*/

// Queries that are specific to 'Errors' index
// ###########################################
// ###########################################

/*
const {
	construct: errorsConstruct,
	fetchAllErrors,
	updateAddError,
	deleteAllErrors,createErrorIndex
} = require('./js-build/api/elastic/updateErrors/Tests/UpdateErrorsIndexing');
*/

/*
errorsConstruct();
fetchAllErrors();
updateAddError();
deleteAllErrors();
createErrorIndex();
*/

// ##############################################################################################
// ### Redis Cloud APIs #########################################################################
// ##############################################################################################

// Redis Cloud Queue Utility Functions
// ###################################
// ###################################
/*
const {
	deserializeItems,
	getRedisCloudData,
} = require('./js-build/api/redisCloud/base/Tests/RedisQueueUtils');
*/

/*
getRedisCloudData();
deserializeItems();
*/

// Basic Redis Cloud Queue Client
// ##############################
// ##############################
/*
const {
	construct: constructRedisQueue,
	enqueue,
	dequeue,
	exists,
	bEnqueue,
	bDequeueAll,
	qSize,
} = require('./js-build/api/redisCloud/base/Tests/RedisQueueClient');
*/

/*
constructRedisQueue();
enqueue();
dequeue();
exists();
bEnqueue();
bDequeueAll();
qSize();
*/

// ##############################################################################################
// ### Israel Post API Requests  ################################################################
// ##############################################################################################

// Check the Basic 'Perform Request' Function: User Request
// ########################################################
// ########################################################
/*
const {
	buildAndPerformUserRequest,
} = require('./js-build/api/postOfficeCalls/base/Tests/PostofficeApiCall');
*/
// buildAndPerformUserRequest();

// Build Post Office Configuration: Check Construction
// ###################################################
// ###################################################
/*
const {
	multipleConfigBuildsInSingleRun,
} = require('./js-build/api/postOfficeCalls/base/Tests/PostofficeRequestConfig');
*/
// multipleConfigBuildsInSingleRun();

// Perform Request: User Request
// #############################
// #############################
/*
const {
	makeUserRequest,
	makeUserRequestWithProxy,
} = require('./js-build/api/postOfficeCalls/requestConfigs/Tests/CreateUserConfig');
*/

/*
makeUserRequest();
makeUserRequestWithProxy();
*/

// Perform Request: Services Request
// #################################
// #################################
/*
const {
	makeServicesRequest,
	makeServicesRequestWithProxy,
} = require('./js-build/api/postOfficeCalls/requestConfigs/Tests/FetchServicesConfig');
*/
/*
makeServicesRequest();
makeServicesRequestWithProxy();
*/

// Perform Request: Dates Request
// ##############################
// ##############################
/*
const {
	makeDatesRequest,
	makeDatesRequestWithProxy,
} = require('./js-build/api/postOfficeCalls/requestConfigs/Tests/FetchDatesConfig');
*/
/*
makeDatesRequest();
makeDatesRequestWithProxy();
*/

// Perform Request: Times Request
// ##############################
// ##############################
/*
const {
	makeTimesRequest,
	makeTimesRequestWithProxy,
} = require('./js-build/api/postOfficeCalls/requestConfigs/Tests/FetchTimesConfig');
*/
/*
makeTimesRequest();
makeTimesRequestWithProxy();
*/

// ##############################################################################################
// ### Repositories #############################################################################
// ##############################################################################################

// Test Branches Repository
// ########################
// ########################
/*
const {
	getAllBranches,
	getAllBranchesIdAndQnomyCode,
	getAllBranchesIdAndQnomyCodeExcluding,
	testUpdateBranchServices,
} = require('./js-build/data/repositories/Tests/PostofficeBranchesRepository');
*/
/*
getAllBranches();
getAllBranchesIdAndQnomyCode();
getAllBranchesIdAndQnomyCodeExcluding();
testUpdateBranchServices();
*/

// Test Errors Repository
// ######################
// ######################
/*
const {
	getAllErrors,
	addUpdateErrorRecord,
} = require('./js-build/data/repositories/Tests/UpdateErrorRecordsRepository');
*/
/*
getAllErrors();
addUpdateErrorRecord();
*/

// Test Qnomycode, Branch ID pairs  Repository
// ###########################################
// ###########################################
/*
const {
	replaceUnprocessedQueue,
	popPushPair,
	popAllPairs,
} = require('./js-build/data/repositories/Tests/PostofficeCodeIdPairsRepository');
*/
/*
replaceUnprocessedQueue();
popPushPair();
popAllPairs();
*/

// ##############################################################################################
// ### Models ###################################################################################
// ##############################################################################################

// Post Office Branch Services
// ###########################
// ###########################
/*
const {
	constructNewServiceRecord,
	useServiceRecord,
} = require('./js-build/data/models/persistenceModels/Tests/PostofficeBranchServices');
*/
/*
constructNewServiceRecord();
useServiceRecord();
*/

// Update Error Record
// ###################
// ###################
/*
const {
	useErrorRecord,
	testUserErrorConstruction,
	testServiceErrorConstruction,
	testDatesErrorConstruction,
	testTimesErrorConstruction,
} = require('./js-build/data/models/persistenceModels/Tests/UpdateErrorRecord');
*/
/*
useErrorRecord();
testUserErrorConstruction();
testServiceErrorConstruction();
testDatesErrorConstruction();
testTimesErrorConstruction();
*/

// Proxy Endpoint String
// #####################
// #####################
/*
const {
	endpointProxiesStrings,
} = require('./js-build/data/models/dataTransferModels/Tests/ProxyEndpointString');
*/
// endpointProxiesStrings();

// ##############################################################################################
// ### Services  ################################################################################
// ##############################################################################################

/*
	Verified Puppeteer can scrape 'LoadBranches' response,
	producing raw string responses including URL,
	headers, body, and more
*/
// Scrape Browser Responses - as String array
// ##########################################
// ##########################################
/*
const {
	testScrapeBrowserResponses,
} = require('./js-build/services/updateBranches/helpers/scrape/Tests/ScrapeBranches');
*/
// testScrapeBrowserResponses();

// Scrape Filter Validate and Persist branches
// ###########################################
// ###########################################
/*
const {
	testDeleteAddBranches,
	testAddUpdateBranches,
} = require('./js-build/services/updateBranches/Tests/UpdateBranches');
*/
/*
testDeleteAddBranches();
testAddUpdateBranches();
*/

// Wraps Thread communication
// ##########################
// ##########################
/*
const {
	testWorkerWrapper,
} = require('./js-build/services/updateAppointments/helpers/threadCommunication/Tests/CommunicationWrappers');
*/
// testWorkerWrapper();

// Check thread shared memory
// ##########################
// ##########################
/*
const {
	constructNewMemoryView,
	checkIfMemoryView,
} = require('./js-build/data/models/dataTransferModels/Tests/ThreadSharedMemory');
*/
/*
constructNewMemoryView();
checkIfMemoryView();
*/

// Check Atomically synchronised Writing to memory
// ###############################################
// ###############################################
/*
const {
	testSetCellValue,
	testReplaceExpectedValue,
	testAddToCellValue,
} = require('./js-build/services/updateAppointments/helpers/concurrency/Tests/AtomicArrayWriter');
*/
/*
testSetCellValue();
testReplaceExpectedValue();
testAddToCellValue();
*/

// Check Atomically synchronised Writing to memory
// ###############################################
// ###############################################
/*
const {
	testSingleThreadTracking,
	testMultiThreadedTracking,
	testLimitReset,
} = require('./js-build/services/updateAppointments/helpers/consumptionTracker/Tests/RequestTracker');
*/
/*
testSingleThreadTracking();
testMultiThreadedTracking();
testLimitReset();
*/

// Check Mutually Exclusive Writing to memory
// ##########################################
// ##########################################
/*
const {
	testBuildMutexRequestsBatchTracker,
} = require('./js-build/services/updateAppointments/helpers/consumptionTracker/Tests/RequestsBatchTracker');
*/
// testBuildMutexRequestsBatchTracker();

// Re set remote atomic queue that holds unprocessed branches
// ##########################################################
// ##########################################################
/*
const {
	rePopulateUnprocessed,
} = require('./js-build/services/updateAppointments/helpers/queueSetup/Tests/PopulateRedisQueue');
*/
// rePopulateUnprocessed();

// Test Post Office API Requests as Nodes
// ######################################
// ######################################
/*
const {
	testCreateUserNode,
	testFetchServicesNode,
	testFetchDatesNode,
	testFetchTimesNode,
	testCreateUserNodeUsingProxy,
	testFetchServicesNodeUsingProxy,
	testFetchDatesNodeUsingProxy,
	testFetchTimesNodeUsingProxy,
} = require('./js-build/services/updateAppointments/helpers/updateServicesRecord/Tests/PostofficeRequestNodes');
*/
/*
testCreateUserNode();
testFetchServicesNode();
testFetchDatesNode();
testFetchTimesNode();
testCreateUserNodeUsingProxy();
testFetchServicesNodeUsingProxy();
testFetchDatesNodeUsingProxy();
testFetchTimesNodeUsingProxy();
*/

// Test Branch Service Record Updater
// ##################################
// ##################################
/*
const {
	testDepleteContinue,
	testDepleteContinueUseProxy,
} = require('./js-build/services/updateAppointments/helpers/updateServicesRecord/Tests/ConstructServicesRecord');
*/
/*
testDepleteContinue();
testDepleteContinueUseProxy();
*/

// Track the 'depleted' claims
// ###########################
// ###########################
/*
const {
	testSingleThreadedDepletedTracker,
	testMultiThreadedDepletedTracker,
} = require('./js-build/services/updateAppointments/helpers/claimsTracker/Tests/DepletedClaimTracker');
*/
/*
testSingleThreadedDepletedTracker();
testMultiThreadedDepletedTracker();
*/

// Appointments Updater: message handaling
// #######################################
// #######################################
/*
const {
	testHandleStartUpdate,
	testHandleStartUpdateUseProxy,
	testStartUpdateThenStop,
	testStartUpdateThenEndUpdater,
	testStartUpdateThenContinue,
} = require('./js-build/services/updateAppointments/workerThreads/appointmentsUpdater/Tests/MessageHandlers');
*/
/*
testHandleStartUpdate();
testHandleStartUpdateUseProxy();
testStartUpdateThenStop(true);
testStartUpdateThenEndUpdater(true);
testStartUpdateThenContinue(true);
*/

// Appointments Updater: Test Thread Script
// ########################################
// ########################################
/*
const {testUpdaterThread,
	testMultipleUpdaterThread,
} = require('./js-build/services/updateAppointments/workerThreads/appointmentsUpdater/Tests/UpdaterThreadScript')
*/
/*
testUpdaterThread();
testMultipleUpdaterThread();
*/

// Ip Management: message handaling
// ################################
// ################################
/*
const {
	testHandleStartEndpoint,
	testHandleStartThenEndEndpoint
} = require('./js-build/services/updateAppointments/workerThreads/ipManager/Tests/MessageHandler');
*/

// testHandleStartEndpoint();
// testHandleStartThenEndEndpoint();

// Ip Management: Test Thread Script
// #################################
// #################################

/*
const {
	testSingleIpManagerThread,
	testMultipleIpManagerThreads
} = require('./js-build/services/updateAppointments/workerThreads/ipManager/Tests/IpManagerThreadScript')
*/
/*
testSingleIpManagerThread();
testMultipleIpManagerThreads();
*/
// ##############################################################################################
// ### Shared  ##################################################################################
// ##############################################################################################

/*
Functions*/
// const { testReadExisting } = require('./js-build/shared/functions/Tests/ReadEnv');
// testReadExisting();

/*
const {
	testReadSmartProxyFile,
	testReadWebShareFile,
} = require('./js-build/shared/functions/Tests/ReadTextFile');
*/
/*
testReadSmartProxyFile();
testReadWebShareFile();
*/

/*
const {
	testInfoLog,
	testErrorLog,
} = require("./js-build/shared/classes/Tests/WinstonClient");
*/
/*
testInfoLog();
testErrorLog();
*/

// ##############################################################################################
// ### Errors  ##################################################################################
// ##############################################################################################

const { testThrowError } = require("./js-build/errors/Test/ServiceError");
testThrowError();

// ##############################################################################################
// ### Concepts  ################################################################################
// ##############################################################################################

// Test Logger
// require('./js-build/shared/classes/LoggerTest')
