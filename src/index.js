const express = require('express');

const ScrapeAllBranches = require('./routes/all-branches');

const { NotFoundError } = require('./js-build/errors/not-found-error');
const errorHandler = require('./js-build/middlewares/error-handler');
const { TestLab } = require('./js-build/routes/TestLab');
const { TimeSlots } = require('./js-build/routes/TimeSlots');

// ? Do i need to lock this service behind authentication and or authorization ?

const port = 3000;

const onListen = () => {
	console.log(`### Scrape service listens to port ${port} ###`);
};

const app = express();

app.use(ScrapeAllBranches);
app.use(TimeSlots);
app.use(TestLab);
app.all('*', () => {
	throw new NotFoundError();
});

// custom error handler.
app.use(errorHandler);

app.listen(port, onListen);
