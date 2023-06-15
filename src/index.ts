import express from 'express';
import { ScrapePeriodically } from './routes/scrape-periodically';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middlewares/error-handler';

// ? Do i need to lock this service behind authentication and or authorization ?

const port = 3000;

const onListen = () => {
	console.log(`### Scrape service listens to port ${port} ###`);
};

const app = express();

app.use(ScrapePeriodically);
app.all('*', () => {
	throw new NotFoundError();
});

// custom error handler.
app.use(errorHandler);

app.listen(port, onListen);
