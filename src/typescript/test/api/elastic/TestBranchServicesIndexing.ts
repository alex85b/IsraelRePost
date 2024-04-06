import { omit } from '../../../api/elastic/base/ElasticsearchUtils';
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
	console.log('[fetchAllBranches] metadata : ', omit(allBranches, 'data'));

	console.log(
		'[fetchAllBranches] allBranches data length : ',
		JSON.stringify(allBranches.data.hits.hits.length)
	);

	console.log(
		'[fetchAllBranches] allBranches data demo : ',
		JSON.stringify(allBranches.data.hits.hits[0])
	);
};

export const branchesWithoutServices = async () => {
	console.log('** (3) BranchServicesIndexing.branchesWithoutServices **');
	const bServicesIndex = construct();
	const bWithoutServices = await bServicesIndex.branchesWithoutServices();
	console.log('[branchesWithoutServices] metadata : ', omit(bWithoutServices, 'data'));

	console.log(
		'[branchesWithoutServices] allBranches data length : ',
		JSON.stringify(bWithoutServices.data.hits.hits.length)
	);

	console.log(
		'[branchesWithoutServices] allBranches data demo : ',
		JSON.stringify(bWithoutServices.data.hits.hits[0])
	);
};

export const getBranchesExcluding = async () => {
	console.log('** (4) BranchServicesIndexing.getBranchesExcluding **');
	const bServicesIndex = construct();
	console.log('[getBranchesExcluding] Excluding branch id : 129');
	const branchesExcluding = await bServicesIndex.getBranchesExcluding({
		excludeBranchIds: ['129'],
	});

	console.log('[getBranchesExcluding] metadata : ', omit(branchesExcluding, 'data'));

	console.log(
		'[getBranchesExcluding] branchesExcluding data length : ',
		JSON.stringify(branchesExcluding.data.hits.hits.length)
	);

	console.log(
		'[getBranchesExcluding] branchesExcluding data demo : ',
		JSON.stringify(branchesExcluding.data.hits.hits[0])
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

	console.log('[bulkAddBranches] metadata : ', omit(bulkAddReport, 'data'));

	console.log(
		'[bulkAddBranches] bulkAddReport data length : ',
		JSON.stringify(bulkAddReport.data.items.length)
	);

	console.log('[bulkAddBranches] bulkAddReport data : ', JSON.stringify(bulkAddReport.data));
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

	console.log('[updateBranchServices] metadata : ', omit(successfullyUpdated, 'data'));
	console.log(
		'[updateBranchServices] successfullyUpdated data : ',
		JSON.stringify(successfullyUpdated.data)
	);
};

export const fetchAllQnomyCodes = async () => {
	console.log('** (7) BranchServicesIndexing.fetchAllQnomyCodes **');
	const bServicesIndex = construct();
	const qCodes = await bServicesIndex.fetchAllQnomyCodes();

	console.log('[fetchAllQnomyCodes] metadata : ', omit(qCodes, 'data'));

	console.log(
		'[fetchAllQnomyCodes] qCodes data length : ',
		JSON.stringify(qCodes.data.hits.hits.length)
	);

	console.log(
		'[fetchAllQnomyCodes] qCodes data demo : ',
		JSON.stringify(qCodes.data.hits.hits[0])
	);
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
