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
import { ConstructLogMessage } from "../../../../shared/classes/ConstructLogMessage";

import {
	BRANCHES_XHR_RESPONSE_URL,
	URLs,
} from "../../../../shared/constants/ApiEndpoints";

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
		const logConstructor = new ConstructLogMessage(["scrapeBrowserResponses"]);
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
			logConstructor: logConstructor,
		});
		const results = capture.stop();
		if (!results || !results.responses.length) {
			throw Error(
				logConstructor.createLogMessage({
					subject: "failed to capture xhr responses",
				})
			);
		}
		await browser.close();
		return results;
	};
