const express = require('express');

const ScrapeAllBranches = require('./routes/all-branches');

const NotFoundError = require('./js-build/typescript/errors/not-found-error');
const errorHandler = require('./js-build/typescript/middlewares/error-handler');
const elasticTest = require('./routes/elastic-test');
const AllTimeSlots = require('./routes/all-time-slots');

// ? Do i need to lock this service behind authentication and or authorization ?

const port = 3000;

const onListen = () => {
	console.log(`### Scrape service listens to port ${port} ###`);
};

const app = express();

app.use(ScrapeAllBranches);
app.use(AllTimeSlots);
app.use(elasticTest);
app.all('*', () => {
	throw new NotFoundError();
});

// custom error handler.
app.use(errorHandler);

app.listen(port, onListen);
