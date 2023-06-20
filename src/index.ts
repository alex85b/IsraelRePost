import express from 'express';

import { ScrapeAllBranches } from './routes/all-branches';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middlewares/error-handler';
import { elasticTest } from './routes/elastic-test';


// ? Do i need to lock this service behind authentication and or authorization ?

const port = 3000;

const onListen = () => {
	console.log(`### Scrape service listens to port ${port} ###`);
};

const app = express();

app.use(ScrapeAllBranches);
app.use(elasticTest)
app.all('*', () => {
	throw new NotFoundError();
});

// custom error handler.
app.use(errorHandler);

app.listen(port, onListen);
