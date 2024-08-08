import * as dotenv from "dotenv";
import { ErrorSource, ServiceError } from "../../../errors/ServiceError";
import { WinstonClient } from "../../../shared/classes/WinstonClient";
import { PathStack } from "../../../shared/classes/PathStack";

const MODULE_NAME = "Redis Cloud Utilities";

export const getRedisCloudData = () => {
	dotenv.config();
	const logger = new WinstonClient({
		pathStack: new PathStack().push(MODULE_NAME),
	});

	const host = process.env["REDS_HST"] ?? "";
	const port = Number.parseInt(process.env["REDS_PRT"] ?? "-1");
	const password = process.env["REDS_PSS"] ?? "";

	const errorArray: string[] = [];
	if (host === "") {
		errorArray.push("Failed to read RedisCloud host");
	}
	if (password === "") {
		errorArray.push("Failed to read RedisCloud password");
	}
	if (port === -1) {
		errorArray.push("Failed to read RedisCloud port");
	}

	if (errorArray.length) {
		throw new ServiceError({
			logger,
			source: ErrorSource.Internal,
			message: "Redis Cloud Setup has failed",
			details: {
				faults: errorArray.join("; "),
			},
		});
	}

	const redisData = {
		host,
		port,
		password,
	};

	return redisData;
};
