import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { queryAllBranches } from '../scrape-old/QueryAllBranches';
import path from 'path';
import fs from 'fs';
import { UserCreateConfig } from '../api-request-new/requests-config/UserCreateConfig';
import { generateResponse } from '../api-request-new/GenerateResponse';
import {
	IUserCreateResult,
	parseUserCreateResponse,
} from '../api-request-new/parse-response/UserCreateParse';
import { GetServicesConfig } from '../api-request-new/requests-config/GetServicesConfig';
import {
	IGetServicesResult,
	parseGetServicesResponse,
} from '../api-request-new/parse-response/GetServicesParse';
import { SearchDatesConfig } from '../api-request-new/requests-config/SearchDatesConfig';
import { ISearchDatesResult } from '../api-request-new/parse-response/SearchDatesParse';

dotenv.config();

const router = express.Router();

router.get(
	'/api/scrape/testing',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			//
			// Get a path to Elasticsearch certificates.
			const certificatePath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'elastic-cert',
				'http_ca.crt'
			);

			// Read the Certificates file.
			const certificateContents = fs.readFileSync(certificatePath, 'utf8');

			// Query Elasticsearch to get all the branches.
			const { allBranches } = await queryAllBranches(certificateContents);
			const branch = allBranches[10];
			const qnomycode = branch._source.qnomycode;

			const proxyConfig = {
				proxyAuth: {
					password: process.env.PROX_PAS || '',
					username: process.env.PROX_USR || '',
				},
				proxyUrl: (process.env.PROX_ENDP || '') + (process.env.PROX_SPORT || ''),
				useProxy: true,
			};

			const userConfigBuilder = new UserCreateConfig(proxyConfig);

			const parsedCreateResponse = parseUserCreateResponse(
				await generateResponse<UserCreateConfig, IUserCreateResult>(
					userConfigBuilder,
					15000
				)
			);

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

			const parsedServicesResponse = parseGetServicesResponse(
				await generateResponse<GetServicesConfig, IGetServicesResult>(
					servicesConfigBuilder,
					15000
				)
			);

			// Pretend there is a 'for' that iterate 'Services'.
			const { Results } = parsedServicesResponse;
			const service = Results[0];
			const { serviceId, ServiceTypeId } = service;

			const searchDatesBuilder = new SearchDatesConfig({
				...commonConfigInput,
				url: { serviceId: String(serviceId), serviceTypeId: String(ServiceTypeId) },
			});

			const qwe = await generateResponse<SearchDatesConfig, ISearchDatesResult>(
				searchDatesBuilder,
				15000
			);

			res.status(200).send(qwe);
		} catch (error) {
			res.status(500).send({ Error: error });
		}
	}
);

export { router as TestLab };
