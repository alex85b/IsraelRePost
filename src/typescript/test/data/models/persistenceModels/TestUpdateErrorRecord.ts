import { ISingleErrorQueryResponse } from '../../../../api/elastic/updateErrors/UpdateErrorsIndexing';
import {
	IPostofficeUpdateErrorBuilder,
	PostofficeUpdateErrorBuilder,
	useSingleErrorQueryResponse,
} from '../../../../data/models/persistenceModels/UpdateErrorRecord';

console.log('** Test Postoffice Branch Services **');

export const constructNewErrorRecord = async () => {
	console.log('** (1) Construct New Error Record **');
	const onlyUserError = new PostofficeUpdateErrorBuilder()
		.addUserError({ userError: 'fake user error' })
		.build('branchId1')
		.toString();
	console.log('[constructNewErrorRecord] onlyUserError : ', onlyUserError);

	try {
		const FaultyBuild = new PostofficeUpdateErrorBuilder()
			.addUserError({ userError: 'fake user error' })
			.addDateError({
				serviceId: 'service1',
				calendarId: 'calendarID1',
				datesError: 'fake dates error',
			})
			.build('branchId2')
			.toString();

		console.log('[constructNewErrorRecord] FaultyBuild : ', FaultyBuild);
	} catch (error) {
		console.log('[constructNewErrorRecord] FaultyBuild : ', (error as Error).message);
	}

	const userServiceDateError = new PostofficeUpdateErrorBuilder()
		.addUserError({ userError: 'fake user error' })
		.addServiceError({ serviceError: 'fake service error', serviceId: 'service2' })
		.addDateError({
			serviceId: 'service2',
			calendarId: 'calendarID2',
			datesError: 'fake dates error',
		})
		.build('branchId3')
		.toString();
	console.log('[constructNewErrorRecord] userServiceDateError : ', userServiceDateError);

	const userServiceDateTimeError = new PostofficeUpdateErrorBuilder()
		.addUserError({ userError: 'fake user error' })
		.addServiceError({ serviceError: 'fake service error', serviceId: 'service2' })
		.addDateError({
			serviceId: 'service2',
			calendarId: 'calendarID2',
			datesError: 'fake dates error',
		})
		.addTimesError({
			serviceId: 'service2',
			calendarId: 'calendarID2',
			timesError: 'fake service error',
		})
		.build('branchId4')
		.toString();
	console.log('[constructNewErrorRecord] userServiceDateTimeError : ', userServiceDateTimeError);
};

export const useErrorRecord = async () => {
	console.log('** (2) Use Error Record **');
	const rawQueryResponse: ISingleErrorQueryResponse = {
		_index: 'Test Index',
		_id: 'Test_ID1',
		_score: 0,
		_source: {
			userError: 'fake user error 1',
			services: [
				{
					serviceId: 'ServiceID1',
					serviceError: 'Test service ERR',
					dates: [
						{
							calendarId: 'Test Calendar Id1',
							datesError: 'fake dates error 1',
							timesError: 'fake times error 1',
						},
						{
							calendarId: 'Test Calendar Id21',
							datesError: 'fake dates error 21',
							timesError: 'fake times error 21',
						},
					],
				},
				{
					serviceId: 'ServiceID2',
					serviceError: 'Test service ERR',
					dates: [
						{
							calendarId: 'Test Calendar Id2',
							datesError: 'fake dates error 2',
							timesError: 'fake times error 2',
						},
					],
				},
			],
		},
	};
	const errBuilder: IPostofficeUpdateErrorBuilder = useSingleErrorQueryResponse({
		rawQueryResponse: rawQueryResponse,
	});
	console.log('[useErrorRecord] demo : ', errBuilder.build('Branch_Test1').toString());
};
