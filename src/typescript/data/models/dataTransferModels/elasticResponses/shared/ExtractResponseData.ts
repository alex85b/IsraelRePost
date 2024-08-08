import { AxiosResponse } from "axios";
import { ServiceError, ErrorSource } from "../../../../../errors/ServiceError";
import { PathStack } from "../../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../../shared/classes/WinstonClient";

export const extractResponseData = <T>(
	elasticClientResponse: Omit<AxiosResponse<T, any>, "request" | "config">
) => {
	const logger: ILogger = new WinstonClient({
		pathStack: new PathStack().push("Extract Response Data"),
	});
	const { data, headers, status, statusText } = elasticClientResponse;
	const faults: string[] = [];
	if (status !== 200) {
		faults.push(`response status indicates failure ${status ?? "No-status"}`);
		faults.push(`response status text: ${statusText ?? "No-status-text"}`);
	}
	if (typeof data === "undefined" || data === null) {
		faults.push("response contains no data");
	}

	if (faults.length)
		throw new ServiceError({
			logger,
			source: ErrorSource.ThirdPartyAPI,
			message: "Extracted Response Data Is Invalid",
			details: {
				faults: faults.join(" | "),
				response: elasticClientResponse,
			},
		});

	return data as T;
};
