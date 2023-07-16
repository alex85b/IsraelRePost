import { parentPort, workerData } from 'worker_threads';
import { IProxyAuthObject } from './ManageThreads';
import { generateResponse } from '../api-request-new/GenerateResponse';
import {
	IGetServicesResult,
	IParseServiceResponse,
	IParseServicesResponse,
	parseGetServicesResponse,
} from '../api-request-new/parse-response/GetServicesParse';
import {
	IParseDateResponse,
	IParseDatesResponse,
	ISearchDatesResult,
	parseSearchDatesResponse,
} from '../api-request-new/parse-response/SearchDatesParse';
import {
	IParseTimesResponse,
	ISearchTimesResult,
	parseSearchTimesResponse,
} from '../api-request-new/parse-response/SearchTimesParse';
import { GetServicesConfig } from '../api-request-new/requests-config/GetServicesConfig';
import { SearchDatesConfig } from '../api-request-new/requests-config/SearchDatesConfig';
import { SearchTimesConfig } from '../api-request-new/requests-config/SearchTimesConfig';
import {
	IUserCreateResult,
	parseUserCreateResponse,
} from '../api-request-new/parse-response/UserCreateParse';
import { UserCreateConfig } from '../api-request-new/requests-config/UserCreateConfig';
import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { IWorkerData } from './ManageWorkers';

interface ITypeGuardReport {
	success: boolean;
	invalid: string[];
}

interface IScrapeFunctionResponse {
	status: -1 | 0 | 1;
	data:
		| ICommonConfigInput
		| IParseServicesResponse
		| IParseDatesResponse
		| IParseTimesResponse
		| undefined;
}

interface IGetUserResponse extends IScrapeFunctionResponse {
	data: ICommonConfigInput | undefined;
}

interface IGetServicesResponse extends IScrapeFunctionResponse {
	data: IParseServicesResponse | undefined;
}

interface IGetDatesResponse extends IScrapeFunctionResponse {
	data: IParseDatesResponse | undefined;
}

interface IGetTimesResponse extends IScrapeFunctionResponse {
	data: IParseTimesResponse | undefined;
}

interface ICommonConfigInput {
	proxyAuth: {
		password: string;
		username: string;
	};
	proxyUrl: string;
	useProxy: boolean;
	data: {
		token: string;
	};
	headers: {
		Cookie: {
			CentralJWTCookie: string;
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			GCLB: string;
		};
	};
}

export interface IWorkerRerun {
	id: number;
	type: 'rerun';
	data: {
		amount: number;
		branches: ISingleBranchQueryResponse[];
		errors: Error[];
	};
}

export interface IWorkerRequest {
	id: number;
	type: 'req';
}

export interface IWorkerMessage {
	id: number;
	status: 'f' | 's';
	type: 'WorkerDataMessage' | 'WorkerTimeout' | 'WorkerBranchScraped';
}

export interface IWorkerDataMessage extends IWorkerMessage {
	type: 'WorkerDataMessage';
	data: string[];
}

export interface IWorkerTimeout extends IWorkerMessage {
	type: 'WorkerTimeout';
}

export interface IWorkerBranchScraped extends IWorkerMessage {
	status: 's';
	type: 'WorkerBranchScraped';
	branchIndex: number;
}

class BranchWorker {
	branches: ISingleBranchQueryResponse[] = [];
	workerId: number = -1;
	currentService: string = '';
	currentDate: string = '';
	currentTime: string = '';
	proxyConfig: IProxyAuthObject | null = null;
	errors: Error[] = [];
	rerunAttempts = 3;

	// parent: init --> worker: verify worker data --> worker: init-result
	// parent: scrape --> worker: scrape branches --> worker: scrape-result
	// parent: end --> worker: exit
	// There must be a timeout that hard-stops worker runtime, i do not want 'escaped' workers
	listen() {
		parentPort?.on('message', async (message: any) => {
			const command = message.type;
			if (command === 'init') {
				this.verifyWorkerData();
			}
			if (command === 'scrape') {
				this.startTimeout({ minutes: 10 });
				this.scrapeBranches({ branches: this.branches });
			}
			if (command === 'end') {
			}
		});
	}

	async scrapeBranches(data: { branches: ISingleBranchQueryResponse[] }) {
		for (let index = 0; index < data.branches.length; index++) {
			const currentBranch = data.branches.pop();
			if (!currentBranch) break;
			try {
				const getUserResponse = await this.getUser();
				if (getUserResponse.data) {
					const getServicesResponse = await this.getServices({
						commonConfigInput: getUserResponse.data,
						qnomycode: currentBranch._source.qnomycode,
					});
					if (getServicesResponse.data) {
						for (const service of getServicesResponse.data.Results) {
							const getDatesResponse = await this.getDates({
								commonConfigInput: getUserResponse.data,
								service: service,
							});
							if (getDatesResponse.data) {
								for (const date of getDatesResponse.data.Results) {
									const getTimesResponse = await this.getTimes({
										commonConfigInput: getUserResponse.data,
										date: date,
										service: service,
									});
									if (getTimesResponse.data) {
										//* Success.
										const branchScraped: IWorkerBranchScraped = {
											status: 's',
											type: 'WorkerBranchScraped',
											id: this.workerId,
											branchIndex: index,
										};
										parentPort?.postMessage(branchScraped);
										continue;
									}
								}
							}
						}
					}
				}
			} catch (error) {
				this.errors.push(error as Error);
			}
		}
	}

	async getUser() {
		const userConfigBuilder = new UserCreateConfig(this.proxyConfig!);
		await this.requestCoordinator(this.workerId);
		const response: IGetUserResponse = { status: 0, data: undefined };
		try {
			const createResponse = await generateResponse<
				UserCreateConfig,
				IUserCreateResult
			>(userConfigBuilder, 40000);
			const parsedCreateResponse = parseUserCreateResponse(createResponse);

			const commonConfigInput = {
				...parsedCreateResponse,
				proxyAuth: this.proxyConfig!.proxyAuth,
				proxyUrl: this.proxyConfig!.proxyUrl,
				useProxy: this.proxyConfig!.useProxy,
			};
			response.status = 1;
			response.data = commonConfigInput;
			return response;
		} catch (error) {
			this.errors.push(error as Error);
			return response;
		}
	}

	async getServices(data: {
		qnomycode: number;
		commonConfigInput: ICommonConfigInput;
	}) {
		const { commonConfigInput, qnomycode } = data;
		const servicesConfigBuilder = new GetServicesConfig({
			...commonConfigInput,
			url: { locationId: String(qnomycode), serviceTypeId: '0' },
		});
		await this.requestCoordinator(this.workerId);
		const response: IGetServicesResponse = { status: 0, data: undefined };
		try {
			const servicesResponse = await generateResponse<
				GetServicesConfig,
				IGetServicesResult
			>(servicesConfigBuilder, 40000);
			const parsedServicesResponse = parseGetServicesResponse(servicesResponse);
			response.status = 1;
			response.data = parsedServicesResponse;
			return response;
		} catch (error) {
			this.errors.push(error as Error);
			return response;
		}
	}

	async getDates(data: {
		commonConfigInput: ICommonConfigInput;
		service: IParseServiceResponse;
	}) {
		const { commonConfigInput, service } = data;
		const { serviceId, ServiceTypeId } = service;
		const searchDatesBuilder = new SearchDatesConfig({
			...commonConfigInput,
			url: { serviceId: String(serviceId), serviceTypeId: String(ServiceTypeId) },
		});
		await this.requestCoordinator(this.workerId);
		const response: IGetDatesResponse = { status: 0, data: undefined };
		try {
			const datesResponse = await generateResponse<
				SearchDatesConfig,
				ISearchDatesResult
			>(searchDatesBuilder, 40000);
			const parsedDatesResponse = parseSearchDatesResponse(datesResponse);
			response.status = 1;
			response.data = parsedDatesResponse;
			return response;
		} catch (error) {
			this.errors.push(error as Error);
			return response;
		}
	}

	async getTimes(data: {
		commonConfigInput: ICommonConfigInput;
		date: IParseDateResponse;
		service: IParseServiceResponse;
	}) {
		const { commonConfigInput, date, service } = data;
		const { calendarId } = date;
		const { serviceId } = service;

		const searchTimesBuilder = new SearchTimesConfig({
			...commonConfigInput,
			url: {
				CalendarId: String(calendarId),
				ServiceId: String(serviceId),
				dayPart: '0',
			},
		});
		await this.requestCoordinator(this.workerId);
		const response: IGetTimesResponse = { status: 0, data: undefined };
		try {
			const timesResponse = await generateResponse<
				SearchTimesConfig,
				ISearchTimesResult
			>(searchTimesBuilder, 40000);
			const parsedTimesResponse = parseSearchTimesResponse(timesResponse);
			response.status = 1;
			response.data = parsedTimesResponse;
			return response;
		} catch (error) {
			this.errors.push(error as Error);
			return response;
		}
	}

	// Parse this.errors into something uniform!
	serializeErrors() {}

	requestCoordinator = async (id: number) => {
		await new Promise((resolve, reject) => {
			const request: IWorkerRequest = { id: id, type: 'req' };
			parentPort?.postMessage(request);
			parentPort?.once('message', (message) => {
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
			id: this.workerId,
			status: 'f',
			type: 'WorkerDataMessage',
			data: report.invalid,
		};

		if (!report.success) {
			parentPort?.postMessage(workerDataMessage);
			process.exit(1);
		}

		this.branches = processBranches;
		this.workerId = this.workerId;
		this.proxyConfig = proxyConfig;
		workerDataMessage.status = 's';
		workerDataMessage.data = [];
		parentPort?.postMessage(workerDataMessage);
	}

	verifyId(id: number, report: ITypeGuardReport) {
		if (typeof id !== 'number' || id < 0) {
			report.success = false;
			report.invalid.push(`id not a valid number ${id}`);
		}
		return report;
	}

	verifyBranches(
		branches: ISingleBranchQueryResponse[],
		report: ITypeGuardReport
	) {
		if (!branches) {
			report.success = false;
			report.invalid.push('branches null / undefined');
		} else if (!Array.isArray(branches)) {
			report.success = false;
			report.invalid.push('branches not array');
		} else if (branches.length < 1) {
			report.success = false;
			report.invalid.push('branches empty array');
		}
		return report;
	}

	verifyProxyConfig(proxyConfig: IProxyAuthObject, report: ITypeGuardReport) {
		if (!proxyConfig) {
			report.success = false;
			report.invalid.push('proxy config null / undefined');
		} else if (typeof proxyConfig.useProxy !== 'boolean') {
			report.success = false;
			report.invalid.push('useProxy is not a boolean');
		} else if (typeof proxyConfig.proxyUrl !== 'string') {
			report.success = false;
			report.invalid.push('proxyUrl is not a string');
		} else if (!proxyConfig.proxyAuth) {
			report.success = false;
			report.invalid.push('proxy auth config null / undefined');
		} else if (typeof proxyConfig.proxyAuth.password !== 'string') {
			report.success = false;
			report.invalid.push('proxy password is not a string');
		} else if (typeof proxyConfig.proxyAuth.username !== 'string') {
			report.success = false;
			report.invalid.push('proxy username is not a string');
		}
		return report;
	}

	startTimeout(data: { minutes: number }) {
		const THREAD_RUNTIME_TIMEOUT = data.minutes * 60 * 1000; // minutes in milliseconds
		setTimeout(() => {
			const TimeOutFailure: IWorkerTimeout = {
				status: 'f',
				type: 'WorkerTimeout',
				id: this.workerId,
			};
			parentPort?.postMessage(TimeOutFailure);
			process.exit(1);
		}, THREAD_RUNTIME_TIMEOUT);
	}
}

const worker = new BranchWorker();
worker.listen();
