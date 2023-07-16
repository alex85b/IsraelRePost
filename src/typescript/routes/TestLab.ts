import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

router.get(
	'/api/scrape/testing',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.status(200).send('No tests!');
		} catch (error) {
			console.log(error);
			next(error as Error);
		}
	}
);

export { router as TestLab };
