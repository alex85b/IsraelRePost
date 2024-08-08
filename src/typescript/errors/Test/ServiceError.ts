import { PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";
import { ErrorSource, ServiceError } from "../ServiceError";

console.log("** Test Service Error **");

export const testThrowError = async () => {
	console.log("** (1) Test Service Error | Test Throw Error **");
	const pathStack = new PathStack();
	pathStack.push("Errors").push("Tests").push("Test Throw Error");
	const logger: ILogger = new WinstonClient({ pathStack });
	try {
		throw new ServiceError({
			message: "This is a simple test Service error",
			logger,
			source: ErrorSource.Internal,
		});
	} catch (error) {
		logger.logInfo({ message: "A simple Error was successfuly thrown" });
	}

	try {
		throw new ServiceError({
			message: "This is a Complex test Service error",
			logger,
			source: ErrorSource.Internal,
			details: { foo: "bar" },
		});
	} catch (error) {
		logger.logInfo({
			message: "A Complex (including Details) Error was successfuly thrown",
		});
	}
};
