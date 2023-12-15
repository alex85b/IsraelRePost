console.log('### Initiate Tests of IsraelRePost ###');

const { testAPIs } = require('./js-build/test/suites/IsraelPostsAPIs');
const {
	smartProxyObjects,
	webShareProxyObject,
} = require('./js-build/test/proxy-collection/testProxyObjects');
const { testNodes } = require('./js-build/test/suites/RequestNodes');

// testAPIs();
// smartProxyObjects();
// webShareProxyObject();
testNodes();
