import {
	IUpdateErrorRecordsRepository,
	UpdateErrorRecordsRepository,
} from '../../../../data/repositories/UpdateErrorRecordsRepository';

console.log('** Test Update-Error Records Repository **');

export const getAllErrors = async () => {
	console.log('** (1) Update-Error Records Repository | Get All Errors **');
	const eRepo: IUpdateErrorRecordsRepository = new UpdateErrorRecordsRepository();
	const allErrors = await eRepo.getAllErrorRecords();
	console.log('[getAllErrors] allErrors demo : ', allErrors[0].toString());
};
