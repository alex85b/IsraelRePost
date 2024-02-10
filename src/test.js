console.log('### Initiate Tests of IsraelRePost ###');

const { testAPIs } = require('./js-build/test/suites/IsraelPostsAPIs');
const {
	smartProxyObjects,
	webShareProxyObject,
} = require('./js-build/test/proxy-collection/testProxyObjects');
const { testNodes } = require('./js-build/test/suites/RequestNodes');
const { setupNodeDepth1 } = require('./js-build/test/transferable/Root');
const {
	constructCounter,
	resetCounter,
	addToCounter,
	subtractFromCounter,
	isAtBoundary,
} = require('./js-build/test/atomic-counter/BaseCounter');
const {
	constructRequestData,
	CountDepletedMessages,
	countRequestsBatch,
} = require('./js-build/test/implement-counter/TestImplementations');
const { testE2E } = require('./js-build/test/threads/e2e');
const { conversing } = require('./js-build/test/threads/conversing_d0');
const { testBranchesToProcess, testProcessedBranches } = require('./js-build/test/redis/testRedis');
const {
	TestAppointments,
} = require('./js-build/test/handlers/massage-handlers/Appointments/TestAppointments');
const {
	TestIpManagers,
} = require('./js-build/test/handlers/massage-handlers/IpManagers/TestIpManagers');
const {
	TestNaturalNumbersCounter,
} = require('./js-build/test/atomic-counter/TestNaturalNumbersCounter');
const { testMutexCounter } = require('./js-build/test/async-mutex/base-mutex/TestAsyncMutex');
const {
	testCountConsumedBatch,
} = require('./js-build/test/async-mutex/consumed-batch/TestCountConsumedBatch');
const {
	testVerifyDepletedMessage,
} = require('./js-build/test/atomic-counter/reset-on-depleted/TestResetOnDepleted');
const {
	testCountApiRequest,
} = require('./js-build/test/atomic-counter/count-request/TestCountApiRequest');

// IsraelPostsAPIs
testAPIs(false);

// testProxyObjects
smartProxyObjects(false);
webShareProxyObject(false);

// RequestNodes
testNodes(false);

// transferable/Root
setupNodeDepth1(false);

// atomic-counter/BaseCounter
constructCounter(false);
resetCounter(false);
addToCounter(false);
subtractFromCounter(false);
isAtBoundary(false);

// implement-counter/TestImplementations
constructRequestData(false);
CountDepletedMessages(false);
countRequestsBatch(false);

// threads/conversing_d0
conversing(false);

// threads/e2e
testE2E(false);

// redis/testRedis
testBranchesToProcess(false);

// massage-handlers/Appointments/TestAppointments
TestAppointments(false);

// IpManagers/TestIpManagers
TestIpManagers(false);

// /atomic-counter/TestThreadSafeCounter'
TestNaturalNumbersCounter(false);

// async-mutex/base-mutex/TestAsyncMutex
testMutexCounter(false);

// async-mutex/consumed-batch/TestCountConsumedBatch
testCountConsumedBatch(false);

// atomic-counter/reset-on-depleted/TestResetOnDepleted
testVerifyDepletedMessage(false);

// atomic-counter/count-request/TestCountApiRequest
testCountApiRequest(true);
