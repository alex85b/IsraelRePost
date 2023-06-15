import { CustomError } from '../errors/custom-error';
import { Request, Response, NextFunction } from 'express';

/*
    Will be used to Always response with a { errors: [{ message: error-message}, { message: error-message}, ...]}.
*/

// A function that uses an error to generate response.
const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// Is error is from the expected type.
	if (err instanceof CustomError) {
		return res.status(err.statusCode).send({ errors: err.serializeErrors() });
	}

	// Error isn't from the expected type.
	// Something unexpected has gone wrong.
	console.error(err);

	res.status(500).send({
		errors: [{ message: 'Something went wrong' }],
	});
};

export { errorHandler };
