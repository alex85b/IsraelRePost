import {
	IPostofficeBranchServices,
	PostofficeBranchServicesBuilder,
	branchServicesFromRecords,
} from '../../../../data/models/persistenceModels/PostofficeBranchServices';

console.log('** Test Postoffice Branch Services **');

export const constructNewServiceRecord = async () => {
	console.log('** (1) Construct New Service Record **');
	const branchServices: IPostofficeBranchServices = new PostofficeBranchServicesBuilder()
		.addService({
			serviceId: 'service1',
			serviceName: 'testService',
		})
		.addDate({
			serviceId: 'service1',
			calendarDate: 'date1',
			calendarId: 'date1',
		})
		.addHours({ serviceId: 'service1', calendarId: 'date1', hours: ['1234', '455'] })
		.build(991);

	console.log(
		'[constructNewServiceRecord] branchServices toString : ',
		branchServices.toString()
	);
	console.log(
		'[constructNewServiceRecord] branchServices getServices : ',
		JSON.stringify(branchServices.getServices(), null, 2)
	);
};

export const useServiceRecord = async () => {
	console.log('** (2) Use Service Record **');
	const branchServices = branchServicesFromRecords({
		branchId: 999,
		branchServices: [
			{
				serviceName: 'test_service1',
				serviceId: 'sId1',
				dates: [
					{
						calendarId: 'cId1',
						calendarDate: 11 as unknown as string,
						hours: ['1', '2', '3'],
					},
				],
			},
			{
				serviceName: 'test_service2',
				serviceId: 'sId2',
				dates: [
					{ calendarId: 'cId2', calendarDate: 'bad-date2', hours: ['4', '5', '6', '7'] },
				],
			},
		],
	});

	const { faults, branchServices: servicesModel } = branchServices;

	if (servicesModel) {
		console.log('[useServiceRecord] servicesModel toString : ', servicesModel.toString());
		console.log(
			'[useServiceRecord] servicesModel getServices : ',
			JSON.stringify(servicesModel.getServices(), null, 2)
		);
	}

	if (faults.length)
		console.log('[useServiceRecord] branchServices faults : ', JSON.stringify(faults, null, 2));

	const emptyServicesArray = branchServicesFromRecords({
		branchId: 998,
		branchServices: [],
	});

	const { faults: emptyFaults, branchServices: emptyServicesModel } = emptyServicesArray;

	if (emptyServicesModel) {
		console.log('[useServiceRecord] servicesModel toString : ', emptyServicesModel.toString());
		console.log(
			'[useServiceRecord] servicesModel getServices : ',
			JSON.stringify(emptyServicesModel.getServices(), null, 2)
		);
	}

	if (emptyFaults.length)
		console.log(
			'[useServiceRecord] branchServices faults : ',
			JSON.stringify(emptyFaults, null, 2)
		);
};
