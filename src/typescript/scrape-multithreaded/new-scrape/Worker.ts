import { parentPort, workerData } from 'worker_threads';
import { generateResponse } from '../../api-request-new/GenerateResponse';
import {
	parseGetServicesResponse,
	IGetServicesResult,
} from '../../api-request-new/parse-response/GetServicesParse';
import {
	parseSearchDatesResponse,
	ISearchDatesResult,
} from '../../api-request-new/parse-response/SearchDatesParse';
import {
	parseSearchTimesResponse,
	ISearchTimesResult,
} from '../../api-request-new/parse-response/SearchTimesParse';
import {
	parseUserCreateResponse,
	IUserCreateResult,
} from '../../api-request-new/parse-response/UserCreateParse';
import { GetServicesConfig } from '../../api-request-new/requests-config/GetServicesConfig';
import { SearchDatesConfig } from '../../api-request-new/requests-config/SearchDatesConfig';
import { SearchTimesConfig } from '../../api-request-new/requests-config/SearchTimesConfig';
import { UserCreateConfig } from '../../api-request-new/requests-config/UserCreateConfig';
import { ISingleBranchQueryResponse } from '../../interfaces/IBranchQueryResponse';
import { NotProvided } from '../../errors/NotProvided';

// Not used yet.
export interface IWorkerMessage {
	id: number;
	messageType: 'up' | 'resource';
	attachment?: any;
}

const processBranchWrapper = async () => {
	const { id, branches } = workerData;

	if (!id || typeof id !== 'number' || id < 1)
		throw new NotProvided({
			message: 'id workerdata is invalid',
			source: 'processBranchWrapper',
		});

	if (!branches || !Array.isArray(branches) || branches.length < 1)
		throw new NotProvided({
			message: 'branches workerdata is invalid',
			source: 'processBranchWrapper',
		});

	parentPort?.once('message', async (message: any) => {
		if (message?.type && message?.type === 'run') {
			while (branches) {
				const processBranch = branches.pop();
				if (!processBranch) break;
				try {
					//? Here should be a 'set timeout --> throw error.'
					const processResult = await processBranchTest(processBranch, id);
					console.log(processResult);
				} catch (error) {
					console.log(error);
					throw error as Error;
				}
			}
		}
		process.exit(0);
	});
};

const requestCoordinator = async (id: number) => {
	await new Promise((resolve, reject) => {
		parentPort?.postMessage({ id: id, type: 'req' });
		parentPort?.once('message', (message) => {
			resolve(message);
		});
	});
};

const processBranchTest = async (
	branch: ISingleBranchQueryResponse,
	id = -1
) => {
	let processLevel = 'start';
	try {
		const qnomycode = branch._source.qnomycode;

		const proxyConfig = {
			proxyAuth: {
				password: process.env.PROX_PAS || '',
				username: process.env.PROX_USR || '',
			},
			proxyUrl: (process.env.PROX_ENDP || '') + (process.env.PROX_SPORT || ''),
			useProxy: false,
		};

		const userConfigBuilder = new UserCreateConfig(proxyConfig);

		requestCoordinator(id);
		const parsedCreateResponse = parseUserCreateResponse(
			await generateResponse<UserCreateConfig, IUserCreateResult>(
				userConfigBuilder,
				15000
			)
		);
		processLevel = 'Done: parsedCreateResponse';

		const commonConfigInput = {
			...parsedCreateResponse,
			proxyAuth: proxyConfig.proxyAuth,
			proxyUrl: proxyConfig.proxyUrl,
			useProxy: proxyConfig.useProxy,
		};

		const servicesConfigBuilder = new GetServicesConfig({
			...commonConfigInput,
			url: { locationId: String(branch._source.qnomycode), serviceTypeId: '0' },
		});

		requestCoordinator(id);
		const parsedServicesResponse = parseGetServicesResponse(
			await generateResponse<GetServicesConfig, IGetServicesResult>(
				servicesConfigBuilder,
				15000
			)
		).Results;
		processLevel = 'Done: parsedServicesResponse';

		// Pretend there is a 'for' that iterate 'Services'.
		const { serviceId, ServiceTypeId } = parsedServicesResponse[0];

		const searchDatesBuilder = new SearchDatesConfig({
			...commonConfigInput,
			url: { serviceId: String(serviceId), serviceTypeId: String(ServiceTypeId) },
		});

		requestCoordinator(id);
		const parsedDatesResponse = parseSearchDatesResponse(
			await generateResponse<SearchDatesConfig, ISearchDatesResult>(
				searchDatesBuilder,
				15000
			)
		).Results;
		processLevel = 'Done: parsedDatesResponse';

		// Pretend there is a 'for' that iterate 'Dates'.
		const { calendarId } = parsedDatesResponse[0];

		const searchTimesBuilder = new SearchTimesConfig({
			...commonConfigInput,
			url: {
				CalendarId: String(calendarId),
				ServiceId: String(serviceId),
				dayPart: '0',
			},
		});

		requestCoordinator(id);
		const parsedTimesResponse = parseSearchTimesResponse(
			await generateResponse<SearchTimesConfig, ISearchTimesResult>(
				searchTimesBuilder,
				15000
			)
		);
		processLevel = 'Done: parsedTimesResponse';

		return {
			success: true,
			processLevel: processLevel,
			data: null,
		};
	} catch (error) {
		return {
			success: false,
			processLevel: processLevel,
			data: { branch: branch._source, error: error as Error },
		};
	}
};

processBranchWrapper();
