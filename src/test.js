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

// threads/e2e
testE2E(true);
