import { omit } from '../../../api/elastic/base/ElasticsearchUtils';
import {
	IErrorMapping,
	UpdateErrorsIndexing,
} from '../../../api/elastic/updateErrors/UpdateErrorsIndexing';

console.log('** Test Update Error Indexing **');

export const construct = () => {
	console.log('** (1) new UpdateErrorsIndexing **');
	const uErrorsIndex = new UpdateErrorsIndexing();
	if (!uErrorsIndex)
		throw Error('[construct] Test Failed, UpdateErrorsIndexing is null Or undefined');
	else console.log('[construct] UpdateErrorsIndexing is not null Or undefined');
	return uErrorsIndex;
};

export const fetchAllErrors = async () => {
	console.log('** (2) BranchServicesIndexing.fetchAllBranches **');
	const uErrorsIndex = construct();
	const allErrors = await uErrorsIndex.fetchAllErrors();
	console.log('[fetchAllErrors] metadata : ', omit(allErrors, 'data'));

	console.log('[fetchAllErrors] allBranches data length : ', allErrors.data.hits.hits.length);

	console.log(
		'[fetchAllErrors] allBranches data demo : ',
		JSON.stringify(allErrors.data.hits.hits[0], null, 3)
	);
};

export const updateAddError = async () => {
	console.log('** (3) BranchServicesIndexing.updateAddError **');
	const uErrorsIndex = construct();
	const fakeError: IErrorMapping = {
		userError: 'fake user error',
		services: [
			{
				serviceId: 'serviceID_1',
				serviceError: 'fake service error',
				dates: [
					{
						calendarId: '2024-03-26T20:41:01',
						datesError: 'fake date error',
						timesError: 'fake time error',
					},
				],
			},
		],
	};
	const updateStatus = await uErrorsIndex.updateAddError({
		branchIndex: 9997,
		errorRecord: fakeError,
	});
	console.log('[updateAddError] metadata : ', omit(updateStatus, 'data'));
	console.log(
		'[updateAddError] updateStatus data : ',
		JSON.stringify(updateStatus.data, null, 3)
	);
};

export const deleteAllErrors = async () => {
	console.log('** (4) BranchServicesIndexing.deleteAllErrors **');
	const uErrorsIndex = construct();
	const deletedAmount = await uErrorsIndex.deleteAllErrors();
	console.log('[deleteAllErrors] metadata : ', omit(deletedAmount, 'data'));
	console.log(
		'[deleteAllErrors] deletedAmount data : ',
		JSON.stringify(deletedAmount.data, null, 3)
	);
};
