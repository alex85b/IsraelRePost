import { ISingleBranchQueryResponse } from "../elastic/elstClient";
import { parentPort, workerData } from "worker_threads";
import { Branch, IBranchReport } from "./branch-record-object/Branch";
import { IWorkerData } from "./ManageWorkers";

// ####################################################################################################
// ### Interfaces #####################################################################################
// ####################################################################################################

export interface IWorkerMessage {
	workerId: number;
	branchIndex: number | null;
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
	private scrapedFailed = false;
	private proxyConfig = {
		proxyPassword: "",
		proxyUrl: "",
		proxyUsername: "",
		timeout: 10000,
		useProxy: false,
	};

	listen() {
		parentPort?.on("message", async (message: any) => {
			// console.log("[Worker][listen()] message : ", message);
			switch (message.type) {
				case "init":
					this.verifyWorkerData();
					break;
				case "scrape":
					this.startExpiration({ minutes: 10 });
					await this.scrapeBranches(this.branches);
					const branchScraped: IWorkerMessage = {
						status: this.scrapedFailed ? "f" : "s",
						type: "done",
						branchIndex: null,
						workerId: this.workerId,
						data: this.branchReports ?? [],
					};
					parentPort?.postMessage(branchScraped);
					break;
				case "ack":
					break;
				case "end":
					process.exit(0);
					break;
				default:
					process.exit(-2);
					break;
			}
		});
	}

	async scrapeBranches(branches: ISingleBranchQueryResponse[]) {
		for (let branchIndex = 0; branchIndex < branches.length; branchIndex++) {
			const branch = new Branch(branches[branchIndex]._source, this.proxyConfig, {
				callBack: this.requestCoordinator,
				id: this.workerId,
			});

			const updateServicesReport = await branch.updateBranchServices();
			if (updateServicesReport.requestsHadError === true) this.scrapedFailed = true;
			const workerScraped: IWorkerMessage = {
				workerId: this.workerId,
				branchIndex: branchIndex,
				status: updateServicesReport.requestsHadError ? "f" : "s",
				type: "scraped",
				data: [updateServicesReport],
			};
			parentPort?.postMessage(workerScraped);
			this.branchReports.push(updateServicesReport);
		}
	}

	requestCoordinator = async (id: number) => {
		await new Promise((resolve, reject) => {
			const request: IWorkerMessage = {
				workerId: id,
				status: null,
				type: "coordinate",
				data: null,
				branchIndex: null,
			};
			parentPort?.postMessage(request);
			parentPort?.once("message", (message) => {
				resolve(message);
			});
		});
	};

	verifyWorkerData() {
		const { processBranches, workerId } = workerData as IWorkerData;
		const invalid: string[] = [];
		this.verifyId(workerId, invalid);
		this.verifyBranches(processBranches, invalid);

		const workerDataMessage: IWorkerMessage = {
			workerId: workerId,
			status: "f",
			type: "up",
			data: invalid,
			branchIndex: null,
		};

		if (invalid.length > 0) {
			parentPort?.postMessage(workerDataMessage);
			process.exit(1);
		}

		this.branches = processBranches;
		this.workerId = workerId;
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

	startExpiration(data: { minutes: number }) {
		const THREAD_RUNTIME_TIMEOUT = data.minutes * 60 * 1000; // minutes in milliseconds
		setTimeout(() => {
			const TimeOutFailure: IWorkerMessage = {
				status: "f",
				type: "expired",
				branchIndex: null,
				data: null,
				workerId: this.workerId,
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
