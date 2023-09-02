import { ISingleBranchQueryResponse } from "../../elastic/elstClient";
import { parentPort, workerData } from "worker_threads";
import { Branch } from "../branch-record-object/Branch";
import { Result } from "@elastic/elasticsearch/lib/api/types";
import { IProxyAuthObject, IWorkerData } from "../ManageWorkers";

// ####################################################################################################
// ### Interfaces #####################################################################################
// ####################################################################################################

export interface IBranchReport {
	requestsHadError: boolean | null;
	persistServicesSuccess: boolean | null;
	persistErrorsResult: Result | null;
}

export interface IWorkerMessage {
	id: number;
	status: "f" | "s" | null;
	type: "scraped" | "done" | "coordinate" | "up" | "expired";
	data: IBranchReport[] | string[] | null;
}

// ####################################################################################################
// ### Class ##########################################################################################
// ####################################################################################################

class BranchWorker {
	private branches: ISingleBranchQueryResponse[] = [];
	private workerId: number = -1;
	private branchReports: IBranchReport[] = [];
	private proxyConfig = {
		proxyPassword: "",
		proxyUrl: "",
		proxyUsername: "",
		timeout: 10000,
		useProxy: false,
	};

	listen() {
		parentPort?.on("message", async (message: any) => {
			switch (message.type) {
				case "init":
					this.verifyWorkerData();
					break;
				case "scrape":
					this.startExpiration({ minutes: 10 });
					await this.scrapeBranches({ branches: this.branches });
					const branchScraped: IWorkerMessage = {
						status: "s",
						type: "scraped",
						id: this.workerId,
						data: [this.branchReports[this.branchReports.length - 1]] ?? [],
					};
					parentPort?.postMessage(branchScraped);
					break;
				case "end":
					process.exit(0);
					break;
				default:
					process.exit(-1);
					break;
			}
		});
	}

	async scrapeBranches(data: { branches: ISingleBranchQueryResponse[] }) {
		for (let branchIndex = 0; branchIndex < data.branches.length; branchIndex++) {
			const branch = new Branch(data.branches[branchIndex]._source, this.proxyConfig, {
				callBack: this.requestCoordinator,
				id: this.workerId,
			});
			const updateServicesReport = await branch.updateBranchServices();
		}
	}

	requestCoordinator = async (id: number) => {
		await new Promise((resolve, reject) => {
			const request: IWorkerMessage = {
				id: id,
				status: null,
				type: "coordinate",
				data: null,
			};
			parentPort?.postMessage(request);
			parentPort?.once("message", (message) => {
				resolve(message);
			});
		});
	};

	verifyWorkerData() {
		const { processBranches, proxyConfig, workerId } = workerData as IWorkerData;
		const invalid: string[] = [];
		this.verifyId(workerId, invalid);
		this.verifyBranches(processBranches, invalid);
		this.verifyProxyConfig(proxyConfig, invalid);

		const workerDataMessage: IWorkerMessage = {
			id: workerId,
			status: "f",
			type: "up",
			data: invalid,
		};

		if (invalid.length > 0) {
			parentPort?.postMessage(workerDataMessage);
			process.exit(1);
		}

		this.branches = processBranches;
		this.workerId = workerId;
		this.proxyConfig.proxyPassword = proxyConfig.proxyAuth.password;
		this.proxyConfig.proxyUsername = proxyConfig.proxyAuth.username;
		this.proxyConfig.proxyUrl = proxyConfig.proxyUrl;
		this.proxyConfig.useProxy = proxyConfig.useProxy;
		workerDataMessage.status = "s";
		workerDataMessage.data = [];
		parentPort?.postMessage(workerDataMessage);
	}

	verifyId(id: number, invalid: string[]) {
		if (typeof id !== "number" || id < 0) {
			invalid.push(`id not a valid number ${id}`);
		}
		return invalid;
	}

	verifyBranches(branches: ISingleBranchQueryResponse[], invalid: string[]) {
		if (!branches) {
			invalid.push("branches null / undefined");
		} else if (!Array.isArray(branches)) {
			invalid.push("branches not array");
		} else if (branches.length < 1) {
			invalid.push("branches empty array");
		}
		return invalid;
	}

	verifyProxyConfig(proxyConfig: IProxyAuthObject, invalid: string[]) {
		if (!proxyConfig) {
			invalid.push("proxy config null / undefined");
		} else if (typeof proxyConfig.useProxy !== "boolean") {
			invalid.push("useProxy is not a boolean");
		} else if (typeof proxyConfig.proxyUrl !== "string") {
			invalid.push("proxyUrl is not a string");
		} else if (!proxyConfig.proxyAuth) {
			invalid.push("proxy auth config null / undefined");
		} else if (typeof proxyConfig.proxyAuth.password !== "string") {
			invalid.push("proxy password is not a string");
		} else if (typeof proxyConfig.proxyAuth.username !== "string") {
			invalid.push("proxy username is not a string");
		}
		return invalid;
	}

	startExpiration(data: { minutes: number }) {
		const THREAD_RUNTIME_TIMEOUT = data.minutes * 60 * 1000; // minutes in milliseconds
		setTimeout(() => {
			const TimeOutFailure: IWorkerMessage = {
				status: "f",
				type: "expired",
				id: this.workerId,
				data: null,
			};
			parentPort?.postMessage(TimeOutFailure);
			process.exit(1);
		}, THREAD_RUNTIME_TIMEOUT);
	}
}

// ####################################################################################################
// ### Run ############################################################################################
// ####################################################################################################

const worker = new BranchWorker();
worker.listen();
