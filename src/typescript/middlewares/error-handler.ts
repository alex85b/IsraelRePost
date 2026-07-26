// import { CustomError } from '../errors/custom-error';
import { Request, Response, NextFunction } from "express";
import { ServiceError, ErrorSource } from "../errors/ServiceError";
import { WinstonClient } from "../shared/classes/WinstonClient";
import { PathStack } from "../shared/classes/PathStack";

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
	// if (err instanceof CustomError) {
	// 	console.log("Error handler: known error");
	// 	const errPrintout = (err as CustomError).serializeErrors();
	// 	return res.send({ errors: errPrintout });
	// }

	// Error isn't from the expected type.
	// Something unexpected has gone wrong.
	try {
		throw new ServiceError({
			logger: new WinstonClient({
				pathStack: new PathStack().push("Global Error Handler"),
			}),
			source: ErrorSource.Internal,
			message: "Something went wrong",
			details: {
				error: err.message,
				name: err.name,
			},
		});
	} catch (error) {}

	res.status(500).send({
		errors: [
			{ message: "Something went wrong", error: err.message, name: err.name },
		],
	});
};

module.exports = errorHandler;
