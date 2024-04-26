import { postofficeApiCall } from '../../../../api/postOfficeCalls/base/PostofficeApiCall';
import { buildServicesCallConfig } from '../../../../api/postOfficeCalls/requestConfigs/FetchServicesConfig';
import {
	IExpectedServiceResponse,
	RequestServicesResponse,
} from '../../../../data/models/dataTransferModels/postofficeResponses/RequestServicesResponse';
import { makeUserRequest } from './TestCreateUserConfig';

console.log('** Test Fetch-Services Config **');

export const makeServicesRequest = async () => {
	console.log('** (2) Make Services Request **');
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
