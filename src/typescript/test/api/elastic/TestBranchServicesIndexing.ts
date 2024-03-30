import {
	BranchServicesIndexing,
	IDocumentBranch,
	INewServiceRecord,
} from '../../../api/elastic/branchServices/BranchServicesIndexing';

console.log('** Test Branch Services Indexing **');

export const construct = () => {
	console.log('** (1) new BranchServicesIndexing **');
	const bServicesIndex = new BranchServicesIndexing();
	if (!bServicesIndex)
		throw Error('[construct] Test Failed, BranchServicesIndexing is null Or undefined');
	else console.log('[construct] BranchServicesIndexing is not null / undefined');
	return bServicesIndex;
};

export const fetchAllBranches = async () => {
	console.log('** (2) BranchServicesIndexing.fetchAllBranches **');
	const bServicesIndex = construct();
	const allBranches = await bServicesIndex.fetchAllBranches();
	if (!Array.isArray(allBranches))
		throw Error('[fetchAllBranches] Test Failed, fetchAllBranches response is not array');
	console.log('[fetchAllBranches] allBranches length : ', allBranches.length);
	console.log('[fetchAllBranches] allBranches demo : ', JSON.stringify(allBranches[0]));
};

export const branchesWithoutServices = async () => {
	console.log('** (3) BranchServicesIndexing.branchesWithoutServices **');
	const bServicesIndex = construct();
	const bWithoutServices = await bServicesIndex.branchesWithoutServices();
	if (!Array.isArray(bWithoutServices))
		throw Error(
			'[branchesWithoutServices] Test Failed, branchesWithoutServices response is not array'
		);
	console.log('[branchesWithoutServices] bWithoutServices length : ', bWithoutServices.length);
	console.log(
		'[branchesWithoutServices] bWithoutServices demo : ',
		JSON.stringify(bWithoutServices[0])
	);
};

export const getQnomyCodesExcluding = async () => {
	console.log('** (4) BranchServicesIndexing.getQnomyCodesExcluding **');
	const bServicesIndex = construct();
	console.log('[getQnomyCodesExcluding] Excluding branch id : 129');
	const codesOfBranchesExcluding = await bServicesIndex.getQnomyCodesExcluding({
		excludeBranchIds: ['129'],
	});
	if (!Array.isArray(codesOfBranchesExcluding))
		throw Error(
			'[getQnomyCodesExcluding] Test Failed, branchesWithoutServices response is not array'
		);
	console.log(
		'[getQnomyCodesExcluding] codesOfBranchesExcluding length : ',
		codesOfBranchesExcluding.length
	);
	console.log(
		'[branchesWithoutServices] bWithoutServices demo : ',
		JSON.stringify(codesOfBranchesExcluding[0])
	);
};

export const bulkAddBranches = async () => {
	console.log('** (5) BranchServicesIndexing.bulkAddBranches **');
	const bServicesIndex = construct();
	const bulkThis: IDocumentBranch[] = [];
	bulkThis.push({
		id: 9999,
		branchnumber: 9999,
		branchname: 'סניף1',
		branchnameEN: 'branch1',
		city: 'עיר1',
		cityEN: 'city1',
		street: 'רחוב1',
		streetEN: 'street1',
		streetcode: 'stc1',
		zip: 'zip1',
		qnomycode: 9999,
		qnomyWaitTimeCode: 11,
		haszimuntor: 1,
		isMakeAppointment: 1,
		location: {
			lat: 11,
			lon: 11,
		},
		services: [],
	});
	bulkThis.push({
		id: 9998,
		branchnumber: 9998,
		branchname: 'סניף2',
		branchnameEN: 'branch2',
		city: 'עיר2',
		cityEN: 'city2',
		street: 'רחוב2',
		streetEN: 'street2',
		streetcode: 'stc2',
		zip: 'zip2',
		qnomycode: 9998,
		qnomyWaitTimeCode: 11,
		haszimuntor: 1,
		isMakeAppointment: 1,
		location: {
			lat: 12,
			lon: 12,
		},
		services: [],
	});

	const bulkAddReport = await bServicesIndex.bulkAddBranches({
		addBranches: bulkThis,
	});

	if (!Array.isArray(bulkAddReport))
		throw Error('[bulkAddBranches] Test Failed, bulkAddReport response is not array');
	console.log('[bulkAddBranches] bulkAddBranches length : ', bulkAddReport.length);
	console.log(
		'[branchesWithoutServices] bulkAddReport demo : ',
		JSON.stringify(bulkAddReport[0])
	);
};

export const updateBranchServices = async () => {
	console.log('** (6) BranchServicesIndexing.updateBranchServices **');
	const bServicesIndex = construct();

	const fakeServices: INewServiceRecord[] = [];
	fakeServices.push({
		serviceId: 'serviceID_1',
		serviceName: 'fakeName1',
		dates: [
			{
				calendarDate: '2024-03-26T20:41:01',
				calendarId: 'fakeCID',
				hours: ['00:01', '00:02'],
			},
		],
	});

	const successfullyUpdated = await bServicesIndex.updateBranchServices({
		branchID: '9999',
		services: fakeServices,
	});
	if (!successfullyUpdated)
		throw Error('[updateBranchServices] Test Failed, successfullyUpdated is not n > 0');
	console.log('[updateBranchServices] successfullyUpdated : ', successfullyUpdated);
};

export const fetchAllQnomyCodes = async () => {
	console.log('** (7) BranchServicesIndexing.getQnomyCodesExcluding **');
	const bServicesIndex = construct();
	const qCodes = await bServicesIndex.fetchAllQnomyCodes();
	if (!Array.isArray(qCodes))
		throw Error('[fetchAllQnomyCodes] Test Failed, fetchAllQnomyCodes response is not array');
	console.log('[fetchAllQnomyCodes] qCodes length : ', qCodes.length);
	console.log('[fetchAllQnomyCodes] qCodes demo : ', JSON.stringify(qCodes[0]));
};

export const createBranchIndex = async () => {
	console.log('** (8) BranchServicesIndexing.createBranchIndex **');
	const bServicesIndex = construct();
	const createSuccess = await bServicesIndex.createBranchIndex();
	console.log('[fetchAllQnomyCodes] createSuccess : ', createSuccess);
};

export const deleteAllBranches = async () => {
	console.log('** (9) BranchServicesIndexing.deleteAllBranches **');
	const bServicesIndex = construct();
	const deletedAmount = await bServicesIndex.deleteAllBranches();
	console.log('[deleteAllBranches] deletedAmount : ', deletedAmount);
};

export const deleteBranchIndex = async () => {
	console.log('** (10) BranchServicesIndexing.deleteBranchIndex **');
	const bServicesIndex = construct();
	const deleteSuccess = await bServicesIndex.deleteBranchIndex();
	console.log('[deleteBranchIndex] deleteSuccess : ', deleteSuccess);
};
