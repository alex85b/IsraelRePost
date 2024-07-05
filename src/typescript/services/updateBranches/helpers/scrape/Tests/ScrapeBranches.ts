import { scrapeBrowserResponses } from "../ScrapeBranches";

console.log("** Scrape Branches **");

export const testScrapeBrowserResponses = async () => {
	console.log("** (1) Capture XHR **");
	const filteredBranches = await scrapeBrowserResponses();
	console.log("[captureXhr] first response: ", filteredBranches.responses[0]);
};
