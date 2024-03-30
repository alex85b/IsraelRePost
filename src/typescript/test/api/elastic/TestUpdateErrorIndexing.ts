import {
	IErrorMapping,
	UpdateErrorsIndexing,
} from '../../../api/elastic/updateErrors/UpdateErrorsIndexing';
import { UPDATE_ERRORS_INDEX_NAME } from '../../../shared/constants/elasticIndices/updateErrors/Index';

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
	if (!Array.isArray(allErrors))
		throw Error('[fetchAllErrors] Test Failed, fetchAllErrors response is not array');
	console.log('[fetchAllErrors] allErrors length : ', allErrors.length);
	console.log('[fetchAllErrors] allErrors demo : ', JSON.stringify(allErrors[0]));
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
		branchIndex: 9998,
		errorRecord: fakeError,
	});
	if (String(updateStatus) === 'Failed') {
		throw Error('[updateAddError] Test Failed, updateAddError response: Failed');
	}

	console.log('[fetchAllErrors] updateStatus : ', updateStatus);
};

export const deleteAllErrors = async () => {
	console.log('** (4) BranchServicesIndexing.deleteAllErrors **');
	const uErrorsIndex = construct();
	const deletedAmount = await uErrorsIndex.deleteAllErrors();
	if (!deletedAmount)
		throw Error('[fetchAllErrors] Test Failed, deleteAllErrors response is undefined');
	console.log('[deleteAllErrors] deletedAmount : ', deletedAmount);
};
