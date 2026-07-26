import { HTTPResponse } from "puppeteer";

import {
	NetworkTrafficCapture,
	RequestHandler,
	ResponseHandler,
	StringedInterceptorResults,
	buildPuppeteerBrowser,
	buildPuppeteerPage,
	navigateToUrl,
} from "./base/PuppeteerClient";

import {
	BRANCHES_XHR_RESPONSE_URL,
	URLs,
} from "../../../../shared/constants/ApiEndpoints";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";

const skip: RequestHandler = () => {
	return Promise.resolve(false);
};
const rHandler: ResponseHandler = async (response: HTTPResponse) => {
	const request = response.request();
	if (
		request.resourceType() === "xhr" &&
		request.url() === BRANCHES_XHR_RESPONSE_URL
	) {
		return true;
	}
	return false;
};

export const scrapeBrowserResponses =
	async (): Promise<StringedInterceptorResults> => {
		const pathStack: IPathTracker = new PathStack().push(
			"Scrape Browser responses"
		);
		const logger: ILogger = new WinstonClient({ pathStack });
		const browser = await buildPuppeteerBrowser(true);
		const page = await buildPuppeteerPage(browser);
		const capture = new NetworkTrafficCapture({
			page,
			customResponseHandler: rHandler,
			customRequestHandler: skip,
		});
		capture.start();
		await navigateToUrl({
			page,
			url: URLs.IsraelPostBranches,
		});
		const results = capture.stop();
		if (!results || !results.responses.length) {
			throw new ServiceError({
				logger: logger,
				source: ErrorSource.Internal,
				message: "Failed to capture XHR responses",
			});
		}
		await browser.close();
		return results;
	};
