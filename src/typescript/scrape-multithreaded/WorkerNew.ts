import { parentPort, workerData } from "worker_threads";
import { ISingleBranchQueryResponse } from "../elastic/elstClient";
import { IProxyAuthObject, IWorkerData } from "./ManageWorkers";
import {
	DatesRequest,
	IDatesConfigBuild,
	IDatesResponseReport,
} from "../api-requests/DatesRequest";
import {
	IServicesConfigBuild,
	IServicesResponseReport,
	ServicesRequest,
} from "../api-requests/ServicesRequest";
import {
	ITimesConfigBuild,
	ITimesResponseReport,
	TimesRequest,
} from "../api-requests/TimesRequest";
import { IUserResponseReport, UserRequest } from "../api-requests/UserRequest";
import {
	IAxiosRequestSetup,
	IAxiosResponseReport,
	IConfigBuildData,
	IResponseGenerator,
} from "../api-requests/BranchRequest";
// import { CustomError } from "../errors/custom-error";
// import { ITimeSlotsDocument } from "../interfaces/ITimeSlotsDocument";
interface ITypeGuardReport {
	success: boolean;
	invalid: string[];
}

export interface IWorkerMessage {
	id: number;
	status: "f" | "s";
	type:
		| "WorkerDataMessage"
		| "WorkerTimeout"
		| "WorkerBranchScraped"
		| "WorkerRequest"
		| "WorkerScrapeDone";
}

export interface IWorkerDataMessage extends IWorkerMessage {
	type: "WorkerDataMessage";
	data: string[];
}

export interface IWorkerTimeout extends IWorkerMessage {
	type: "WorkerTimeout";
}

export interface IWorkerBranchScraped extends IWorkerMessage {
	status: "s";
	type: "WorkerBranchScraped";
	branchIndex: number;
	// dbRecords: ITimeSlotsDocument[];
}

export interface IWorkerRequest extends IWorkerMessage {
	type: "WorkerRequest";
}

export interface IWorkerScrapeDone extends IWorkerMessage {
	type: "WorkerScrapeDone";
	errors: {
		branchIndex: number;
		error: string;
		reasons: string;
	}[];
}

export type ErrorOrString = Error | string;

export interface IBranchReport {
	branchNameEn: string;
	branchNumber: number;
	qnomycode: number;
	branchIndex: number;
	success: boolean;
}

interface IUserData {
	token: string;
	CentralJWTCookie: string;
	ARRAffinity: string;
	ARRAffinitySameSite: string;
	GCLB: string;
}

interface ICommonHeaders {
	authorization: string;
	cookies: ICommonCookies;
}

interface ICommonCookies {
	ARRAffinity: string;
	ARRAffinitySameSite: string;
	GCLB: string;
}

interface IFullCookies extends ICommonCookies {
	CentralJWTCookie: string;
}

interface IFullHeaders {
	authorization: string;
	cookies: IFullCookies;
}

interface IRerunRoute {
	branch: ISingleBranchQueryResponse;
	branchIndex: number;
	serviceId: string | null;
	calendarId: string | null;
	reasons: string[];
	error: Error | null;
}

class BranchWorker {
	branches: ISingleBranchQueryResponse[] = [];
	workerId: number = -1;
	proxyConfig = {
		proxyPassword: "",
		proxyUrl: "",
		proxyUsername: "",
		timeout: 10000,
		useProxy: false,
	};
	failedReports: IBranchReport[] = [];
	currentBranch: IBranchReport | null = null;
	rerunRoutes: { [key: number]: IRerunRoute[] } = {};

	// parent: init --> worker: verify worker data --> worker: init-result
	// parent: scrape --> worker: scrape branches --> worker: scrape-result
	// parent: end --> worker: exit
	// There must be a timeout that hard-stops worker runtime, i do not want 'escaped' workers
	listen() {
		parentPort?.on("message", async (message: any) => {
			const command = message.type;
			if (command === "init") {
				this.verifyWorkerData();
			}
			if (command === "scrape") {
				this.startTimeout({ minutes: 10 });
				await this.scrapeBranches({ branches: this.branches });
				const errors = this.serializeErrors();
				const branchScraped: IWorkerScrapeDone = {
					status: errors.errorsAmount > 0 ? "f" : "s",
					type: "WorkerScrapeDone",
					errors: errors.errors,
					id: this.workerId,
				};
				parentPort?.postMessage(branchScraped);
			}
			if (command === "end") {
				process.exit(0);
			}
		});
	}

	async scrapeBranches(data: { branches: ISingleBranchQueryResponse[] }) {
		for (let branchIndex = 0; branchIndex < data.branches.length; branchIndex++) {
			// const branchDocArray: ITimeSlotsDocument[] = [];
			const currentBranch = data.branches[branchIndex];
			const qnomycode = currentBranch._source.qnomycode;
			const report = this.setupReportObject({
				branch: currentBranch,
				branchIndex: branchIndex,
			});
			const commonRequestData = {
				branchIndex: branchIndex,
				currentBranch: currentBranch,
				proxySetup: this.proxyConfig,
			};
			const userData = await this.getUser(commonRequestData);
			if (userData.failedRoute) {
				this.rerunRoutes[branchIndex].push(userData.failedRoute);
				continue;
			}
			const headers = this.setupHeadersObject(true, userData.userData?.data!) as IFullHeaders;
			const servicesResults = await this.getServices({
				...commonRequestData,
				configData: {
					headers,
					url: { locationId: String(qnomycode), serviceTypeId: "0" },
				},
			});
			if (servicesResults.failedRoute) {
				this.rerunRoutes[branchIndex].push(servicesResults.failedRoute);
				continue;
			}
			for (const service of servicesResults.servicesData?.results ?? []) {
				const datesResults = await this.getDates({
					...commonRequestData,
					configData: { headers, url: { serviceId: String(service.serviceId) } },
				});
				if (datesResults.failedRoute) {
					this.rerunRoutes[branchIndex].push(datesResults.failedRoute);
					continue;
				}
				for (const date of datesResults.datesData?.results ?? []) {
					const timesResults = await this.getTimes({
						...commonRequestData,
						configData: {
							headers: this.setupHeadersObject(false, userData.userData?.data!),
							url: {
								CalendarId: String(date.calendarId),
								dayPart: "0",
								ServiceId: String(service.serviceId),
							},
						},
					});
					if (timesResults.failedRoute) {
						this.rerunRoutes[branchIndex].push(timesResults.failedRoute);
						continue;
					}
					// const branchDoc: ITimeSlotsDocument = {
					// 	branchKey: currentBranch._id,
					// 	branchDate: date.calendarDate,
					// 	branchServiceId: service.serviceId,
					// 	branchServiceName: service.serviceName,
					// 	timeSlots: timesResults.datesData?.results ?? [],
					// };
					// branchDocArray.push(branchDoc);
				}
			}
			// this.processReportObject(report, branchIndex, branchDocArray);
		}
	}

	setupReportObject(data: {
		branch: ISingleBranchQueryResponse;
		branchIndex: number;
	}): IBranchReport {
		return {
			branchNameEn: data.branch._source.branchnameEN,
			branchNumber: data.branch._source.branchnumber,
			qnomycode: data.branch._source.qnomycode,
			branchIndex: data.branchIndex,
			success: false,
		};
	}

	setupFailedRouteObject(
		branchData: ISingleBranchQueryResponse,
		branchIndex: number,
		error: Error | null,
		reasons: string[]
	) {
		const failedRoute: IRerunRoute = {
			branch: branchData,
			branchIndex: branchIndex,
			serviceId: null,
			calendarId: null,
			reasons: reasons,
			error: error,
		};
		return failedRoute;
	}

	setupHeadersObject(withToken: boolean, userData: IUserData): IFullHeaders | ICommonHeaders {
		if (withToken) {
			const fHeaders: IFullHeaders = {
				authorization: userData.token,
				cookies: {
					ARRAffinity: userData.ARRAffinity,
					ARRAffinitySameSite: userData.ARRAffinitySameSite,
					CentralJWTCookie: userData.CentralJWTCookie,
					GCLB: userData.GCLB,
				},
			};
			return fHeaders;
		} else {
			const cHeaders: ICommonHeaders = {
				authorization: userData.token,
				cookies: {
					ARRAffinity: userData.ARRAffinity,
					ARRAffinitySameSite: userData.ARRAffinitySameSite,
					GCLB: userData.GCLB,
				},
			};
			return cHeaders;
		}
	}

	// processReportObject(report: IBranchReport, branchIndex: number, branchDocArray: ITimeSlotsDocument[]) {
	// 	if (!this.rerunRoutes[branchIndex] || this.rerunRoutes[branchIndex].length === 0) {
	// 		const branchScraped: IWorkerBranchScraped = {
	// 			status: "s",
	// 			type: "WorkerBranchScraped",
	// 			id: this.workerId,
	// 			branchIndex: branchIndex,
	// 			dbRecords: branchDocArray,
	// 		};
	// 		parentPort?.postMessage(branchScraped);
	// 	} else {
	// 		report.success = false;
	// 		this.failedReports.push(report);
	// 	}
	// }

	async makeRequest<
		K extends IAxiosResponseReport,
		T extends IResponseGenerator<K, P, IAxiosRequestSetup>,
		P extends IConfigBuildData
	>(requestData: {
		branchIndex: number;
		proxySetup: IAxiosRequestSetup;
		responseGenerator: T;
		name: "user" | "services" | "dates" | "times";
		data?: P;
	}) {
		let success = false;
		const response: {
			error: Error | null;
			reasons: string[];
			APIResponse: K | null;
		} = {
			error: null,
			reasons: [],
			APIResponse: null,
		};
		try {
			if (requestData.data) {
				success = requestData.responseGenerator.buildRequestConfig(requestData.data);
			} else {
				success = requestData.responseGenerator.buildRequestConfig();
			}
			if (!success) {
				response.error = requestData.responseGenerator.getError();
				response.reasons.push(`${requestData.name} failed constructing config file`);
				return response;
			}
			await this.requestCoordinator(requestData.branchIndex);
			success = await requestData.responseGenerator.makeAxiosRequest(requestData.proxySetup);
			if (!success) {
				response.error = requestData.responseGenerator.getError();
				response.reasons.push(`${requestData.name} failed Axios request to API`);
				return response;
			}
			response.APIResponse = requestData.responseGenerator.parseAPIResponse();
			// response.error = response.APIResponse.error;
			// response.reasons = response.APIResponse.reason;
			return response;
		} catch (error) {
			response.error = error as Error;
			response.reasons.push(`${requestData.name} failed unexpectedly`);
			return response;
		}
	}

	async getUser(getUserData: {
		proxySetup: IAxiosRequestSetup;
		currentBranch: ISingleBranchQueryResponse;
		branchIndex: number;
	}) {
		const getUserResponse: {
			userData: IUserResponseReport | null;
			failedRoute: IRerunRoute | null;
		} = {
			userData: null,
			failedRoute: null,
		};
		const userData = await this.makeRequest<IUserResponseReport, UserRequest, IConfigBuildData>(
			{
				name: "user",
				branchIndex: getUserData.branchIndex,
				proxySetup: getUserData.proxySetup,
				responseGenerator: new UserRequest(),
			}
		);

		if (!userData.APIResponse) {
			const failedRoute = this.setupFailedRouteObject(
				getUserData.currentBranch,
				getUserData.branchIndex,
				userData.error,
				userData.reasons
			);
			getUserResponse.failedRoute = failedRoute;
		} else getUserResponse.userData = userData.APIResponse;

		return getUserResponse;
	}

	async getServices(getServicesData: {
		proxySetup: IAxiosRequestSetup;
		currentBranch: ISingleBranchQueryResponse;
		branchIndex: number;
		configData: IServicesConfigBuild;
	}) {
		const getServicesResponse: {
			servicesData: IServicesResponseReport | null;
			failedRoute: IRerunRoute | null;
		} = {
			servicesData: null,
			failedRoute: null,
		};
		const servicesData = await this.makeRequest<
			IServicesResponseReport,
			ServicesRequest,
			IServicesConfigBuild
		>({
			name: "services",
			branchIndex: getServicesData.branchIndex,
			proxySetup: getServicesData.proxySetup,
			responseGenerator: new ServicesRequest(),
			data: getServicesData.configData,
		});

		if (!servicesData.APIResponse) {
			const failedRoute = this.setupFailedRouteObject(
				getServicesData.currentBranch,
				getServicesData.branchIndex,
				servicesData.error,
				servicesData.reasons
			);
			getServicesResponse.failedRoute = failedRoute;
		} else getServicesResponse.servicesData = servicesData.APIResponse;

		return getServicesResponse;
	}

	async getDates(getDatesData: {
		proxySetup: IAxiosRequestSetup;
		currentBranch: ISingleBranchQueryResponse;
		branchIndex: number;
		configData: IDatesConfigBuild;
	}) {
		const getDatesResponse: {
			datesData: IDatesResponseReport | null;
			failedRoute: IRerunRoute | null;
		} = {
			datesData: null,
			failedRoute: null,
		};
		const { serviceId } = getDatesData.configData.url;
		const datesData = await this.makeRequest<
			IDatesResponseReport,
			DatesRequest,
			IDatesConfigBuild
		>({
			name: "dates",
			branchIndex: getDatesData.branchIndex,
			proxySetup: getDatesData.proxySetup,
			responseGenerator: new DatesRequest(),
			data: getDatesData.configData,
		});

		if (!datesData.APIResponse) {
			const failedRoute = this.setupFailedRouteObject(
				getDatesData.currentBranch,
				getDatesData.branchIndex,
				datesData.error,
				datesData.reasons
			);
			failedRoute.serviceId = serviceId;
			getDatesResponse.failedRoute = failedRoute;
		} else getDatesResponse.datesData = datesData.APIResponse;

		return getDatesResponse;
	}

	async getTimes(getTimesData: {
		proxySetup: IAxiosRequestSetup;
		currentBranch: ISingleBranchQueryResponse;
		branchIndex: number;
		configData: ITimesConfigBuild;
	}) {
		const getTimesResponse: {
			datesData: ITimesResponseReport | null;
			failedRoute: IRerunRoute | null;
		} = {
			datesData: null,
			failedRoute: null,
		};
		const { ServiceId, CalendarId } = getTimesData.configData.url;

		const timesData = await this.makeRequest<
			ITimesResponseReport,
			TimesRequest,
			ITimesConfigBuild
		>({
			name: "dates",
			branchIndex: getTimesData.branchIndex,
			proxySetup: getTimesData.proxySetup,
			responseGenerator: new TimesRequest(),
			data: getTimesData.configData,
		});

		if (!timesData.APIResponse) {
			const failedRoute = this.setupFailedRouteObject(
				getTimesData.currentBranch,
				getTimesData.branchIndex,
				timesData.error,
				timesData.reasons
			);
			failedRoute.serviceId = ServiceId;
			failedRoute.calendarId = CalendarId;
			getTimesResponse.failedRoute = failedRoute;
		} else getTimesResponse.datesData = timesData.APIResponse;

		return getTimesResponse;
	}

	// Parse this.errors into something uniform!
	//! Change this, JSON is costly and wasteful, you want to extract simple strings.
	serializeErrors() {
		const errorReport: {
			branchIndex: number;
			error: string;
			reasons: string;
		}[] = [];
		const rerunKeys = Object.keys(this.rerunRoutes);
		for (const key in rerunKeys) {
			const branchFailures = this.rerunRoutes[key];
			for (const failure of branchFailures) {
				let failureError = "";
				// if (failure.error instanceof CustomError) {
				// 	failureError = JSON.stringify(failure.error.serializeErrors());
				// } else {
				// 	failureError = JSON.stringify(failure.error);
				// }
				errorReport.push({
					branchIndex: failure.branchIndex,
					error: failureError,
					reasons: failure.reasons.join(";"),
				});
			}
		}
		return { errorsAmount: rerunKeys.length, errors: errorReport };
	}

	requestCoordinator = async (id: number) => {
		await new Promise((resolve, reject) => {
			const request: IWorkerRequest = {
				id: id,
				status: "s",
				type: "WorkerRequest",
			};
			parentPort?.postMessage(request);
			parentPort?.once("message", (message) => {
				resolve(message);
			});
		});
	};

	verifyWorkerData() {
		const { workerId, processBranches, proxyConfig } = workerData as IWorkerData;
		const report: ITypeGuardReport = { success: true, invalid: [] };
		this.verifyId(workerId, report);
		this.verifyBranches(processBranches, report);
		this.verifyProxyConfig(proxyConfig, report);

		const workerDataMessage: IWorkerDataMessage = {
			id: workerId,
			status: "f",
			type: "WorkerDataMessage",
			data: report.invalid,
		};

		if (!report.success) {
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

	verifyId(id: number, report: ITypeGuardReport) {
		if (typeof id !== "number" || id < 0) {
			report.success = false;
			report.invalid.push(`id not a valid number ${id}`);
		}
		return report;
	}

	verifyBranches(branches: ISingleBranchQueryResponse[], report: ITypeGuardReport) {
		if (!branches) {
			report.success = false;
			report.invalid.push("branches null / undefined");
		} else if (!Array.isArray(branches)) {
			report.success = false;
			report.invalid.push("branches not array");
		} else if (branches.length < 1) {
			report.success = false;
			report.invalid.push("branches empty array");
		}
		return report;
	}

	verifyProxyConfig(proxyConfig: IProxyAuthObject, report: ITypeGuardReport) {
		if (!proxyConfig) {
			report.success = false;
			report.invalid.push("proxy config null / undefined");
		} else if (typeof proxyConfig.useProxy !== "boolean") {
			report.success = false;
			report.invalid.push("useProxy is not a boolean");
		} else if (typeof proxyConfig.proxyUrl !== "string") {
			report.success = false;
			report.invalid.push("proxyUrl is not a string");
		} else if (!proxyConfig.proxyAuth) {
			report.success = false;
			report.invalid.push("proxy auth config null / undefined");
		} else if (typeof proxyConfig.proxyAuth.password !== "string") {
			report.success = false;
			report.invalid.push("proxy password is not a string");
		} else if (typeof proxyConfig.proxyAuth.username !== "string") {
			report.success = false;
			report.invalid.push("proxy username is not a string");
		}
		return report;
	}

	startTimeout(data: { minutes: number }) {
		const THREAD_RUNTIME_TIMEOUT = data.minutes * 60 * 1000; // minutes in milliseconds
		setTimeout(() => {
			const TimeOutFailure: IWorkerTimeout = {
				status: "f",
				type: "WorkerTimeout",
				id: this.workerId,
			};
			parentPort?.postMessage(TimeOutFailure);
			process.exit(1);
		}, THREAD_RUNTIME_TIMEOUT);
	}
}

const worker = new BranchWorker();
worker.listen();
