console.log('### Initiate Tests of IsraelRePost ###');

const { testE2E } = require('./js-build/test/threads/e2e');
testE2E(false);

// ##############################################################################################
// ### Test Generators of proxy endpoints #######################################################
// ##############################################################################################

/*
Classes that translate various (and differently constructed) proxy data file,
Into an uniform object*/
// ##########################################################################
// ##########################################################################

const {
	smartProxyObjects,
	webShareProxyObject,
} = require('./js-build/test/proxy-collection/testProxyObjects');

smartProxyObjects(false);
webShareProxyObject(false);

// ##############################################################################################
// ### Test Israel-post APIs ####################################################################
// ##############################################################################################

/*
Fetch an Israel-post's branch appointments,
Chain a series of requests to Israel-post APIs*/
// #############################################
// #############################################
const { testAPIs } = require('./js-build/test/suites/IsraelPostsAPIs');

testAPIs(false);

// ##############################################################################################
// ### Test Nodes That Envelops Israel-post APIs ################################################
// ##############################################################################################

const { testNodes } = require('./js-build/test/suites/RequestNodes');

testNodes(false);

// ##############################################################################################
// ### Test Counters (Atomic and Mutex protected) And Request Limiters ##########################
// ##############################################################################################

/*
Ip-Manager and Appointments-Updater threads use Shared-memory,
In order to track consumption of Israel-post-request,
Currently i use 2 type of request limiters, and a reset-on-event logic,
Those implement an Atomic counter and Mutex.*/

/*
Base Atomic Counter (Single Cell Array), used to construct Request-limiter,
Will be made deprecated and replaced by an Array-Counter*/
// ########################################################################
// ########################################################################
const {
	testNaturalNumbersCounter,
} = require('./js-build/test/atomic-counter/TestIncrementalCounter');

testNaturalNumbersCounter(false);

/*
Base Array-Counter, used to construct Request-limiter*/
// ####################################################
// ####################################################
const {
	Test_BoundaryAwareIncrementalCounter,
} = require('./js-build/test/atomic-counter/TestBoundaryAwareCounter');

Test_BoundaryAwareIncrementalCounter(false);

/*
A Request-limiter, determines if a minutely limit has been reached */
// ##################################################################
// ##################################################################
const {
	testLimitPerMinuteThreaded,
	testLimitPerMinute,
} = require('./js-build/test/atomic-counter/count-request/TestLimitRequests');

testLimitPerMinuteThreaded(false);
testLimitPerMinute(false);

/*
The 'second half' of Request-limiter, This resets Request-limiter*/
// ################################################################
// ################################################################
const {
	testResetLimitPerMinute,
} = require('./js-build/test/atomic-counter/reset-on-depleted/TestIResetRequestLimiter');

testResetLimitPerMinute(false);

/*
The concept of Mutex as a Request-batch-limiter*/
// ##############################################
// ##############################################
const { testMutexCounter } = require('./js-build/test/async-mutex/base-mutex/TestAsyncMutex');

testMutexCounter(false);

/*
A Request-batch-limiter that allows to
Determine if a hourly Request-limit has been reached*/
// ###################################################
// ###################################################
const {
	testLimitPerHour,
} = require('./js-build/test/async-mutex/consumed-batch/TestLimitRequestsBatch');

testLimitPerHour(false);

// ##############################################################################################
// ### Test Cloud-Redis Atomic Queue ############################################################
// ##############################################################################################

/*
Implements a Redis-Cloud database to provide,
Independent and thread safe branches-to-update Queue*/
// ###################################################
const { testBranchesToProcess } = require('./js-build/test/redis/testRedis');

testBranchesToProcess(false);

// ##############################################################################################
// ### Test Appointment-Fetching Worker-Thread ##################################################
// ##############################################################################################

/*
This is the third part of Appointment Update Process,
'Appointment-Fetching' handles fetching and persisting appointments
Of israel-post branches*/
// #################################################################
// #################################################################
const {
	TestAppointments,
} = require('./js-build/test/handlers/massage-handlers/Appointments/TestAppointments');

TestAppointments(false);

// ##############################################################################################
// ### Test Request-Allotment Worker-Thread #####################################################
// ##############################################################################################

/*
This is the second part of Appointment Update Process,
'Request-Allotment' handles limiting requests to israel post*/
// ###########################################################
// ###########################################################
const {
	TestIpManagers,
} = require('./js-build/test/handlers/massage-handlers/IpManagers/TestIpManagers');

TestIpManagers(false);

// ##############################################################################################
// ### New Messaging Concept ####################################################################
// ##############################################################################################

/*
Tests how to send an Enum values as a messages*/
// #############################################
// #############################################
const { testEnumMessages } = require('./js-build/test/messaging/enums/TestEnumMessages');
testEnumMessages(false);

const {
	testHandlersAsStringType,
	testHandlersAsEnums,
	testHandlersEnumsAndFunctions,
} = require('./js-build/test/messaging/handlers/HandlerFunctionConcept');
testHandlersAsStringType(false);
testHandlersAsEnums(false);
testHandlersEnumsAndFunctions(false);

//////////////////////////////////////////////////////////////////////////////////////////////////

const {
	createIndex,
	getIndexMapping,
	getInstance,
	negativePingIndex,
	positivePingIndex,
} = require('./js-build/test/api/elastic/base/testElasticsearchClient');

negativePingIndex();
positivePingIndex();
