import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildServicesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchServicesConfig';
import { buildUsingProxyFile } from '../../../../data/models/dataTransferModels/ProxyEndpointString';
import {
	IExpectedServiceResponse,
	RequestServicesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestServicesResponse';
import { makeUserRequest, makeUserRequestWithProxy } from './TestCreateUserConfig';
import path from 'path';

console.log('** Test Fetch-Services Config **');

export const makeServicesRequest = async () => {
	console.log('** (1) Make Services Request **');
	const demoBranch = {
		_index: 'branches',
		_id: '102',
		_version: 1,
		_seq_no: 1,
		_primary_term: 1,
		found: true,
		_source: {
			id: 9,
			branchnumber: 102,
			branchname: 'בית הכרם',
			branchnameEN: 'Beit Hakerem',
			city: 'ירושלים',
			cityEN: 'Jerusalem',
			street: 'בית הכרם',
			streetEN: 'Beit Hakerem',
			streetcode: '101064',
			zip: '9634346',
			qnomycode: 82,
			qnomyWaitTimeCode: 136,
			haszimuntor: 1,
			isMakeAppointment: 1,
			location: {
				lat: 31.7806279,
				lon: 35.1895441,
			},
			services: [],
		},
	};

	const userResponse = await makeUserRequest();
	const config = buildServicesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		locationId: String(demoBranch._source.qnomycode),
	});

	// console.log('[makeServicesRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedServiceResponse>(config);
	// console.log('[makeServicesRequest] response : ', JSON.stringify(response, null, 3));
	const services = new RequestServicesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeServicesRequest] services : ', services.toString());
	return services.getServices();
};

export const makeServicesRequestWithProxy = async () => {
	console.log('** (2) Make Services Request With Proxy **');
	const demoBranch = {
		_index: 'branches',
		_id: '102',
		_version: 1,
		_seq_no: 1,
		_primary_term: 1,
		found: true,
		_source: {
			id: 9,
			branchnumber: 102,
			branchname: 'בית הכרם',
			branchnameEN: 'Beit Hakerem',
			city: 'ירושלים',
			cityEN: 'Jerusalem',
			street: 'בית הכרם',
			streetEN: 'Beit Hakerem',
			streetcode: '101064',
			zip: '9634346',
			qnomycode: 82,
			qnomyWaitTimeCode: 136,
			haszimuntor: 1,
			isMakeAppointment: 1,
			location: {
				lat: 31.7806279,
				lon: 35.1895441,
			},
			services: [],
		},
	};

	const envFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '.env');
	console.log('[makeServicesRequestWithProxy] path to env : ', envFilepath);
	const proxyFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'WebShare.txt');
	console.log('[makeServicesRequestWithProxy] path to proxy file path : ', proxyFilepath);
	const strings = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: 'PROX_WBSHA_PAS',
		envUsernameKey: 'PROX_WBSHA_USR',
	});

	console.log('[makeServicesRequestWithProxy] strings demo : ', strings[0]);

	const userResponse = await makeUserRequestWithProxy();

	const config = buildServicesCallConfig({
		cookies: userResponse.getCookies(),
		headerAuth: userResponse.getToken(),
		locationId: String(demoBranch._source.qnomycode),
		endpointProxyString: strings[0],
	});

	// console.log('[makeServicesRequest] request config', JSON.stringify(config, null, 3));
	const response = await postofficeApiCall<IExpectedServiceResponse>(config);
	// console.log('[makeServicesRequest] response : ', JSON.stringify(response, null, 3));
	const services = new RequestServicesResponse.Builder().useAxiosResponse(response).build();
	console.log('[makeServicesRequestWithProxy] services : ', services.toString());
	return services.getServices();
};
