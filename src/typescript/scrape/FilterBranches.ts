// import { IDocumentBranch } from '../data/elastic/BranchModel';
// import { IBranch } from '../interfaces/IBranch';

// export interface IRequestBranchesResponse {
// 	filteredBranches: IDocumentBranch[];
// }

// export const filterBranches = (unfilteredBranches: IBranch[]) => {
// 	// Filter out the all the kiosks and shops that only offer mail pickup services.
// 	const filteredBranches: IDocumentBranch[] = unfilteredBranches.reduce(
// 		(accumulator: IDocumentBranch[], branch: IBranch) => {
// 			if (branch.isMakeAppointment === true) {
// 				const newBranch: IDocumentBranch = {
// 					id: branch.id,
// 					branchnumber: branch.branchnumber,
// 					branchname: branch.branchname,
// 					branchnameEN: branch.branchnameEN || '',
// 					city: branch.city,
// 					cityEN: branch.cityEN || '',
// 					street: branch.street,
// 					streetEN: branch.streetEN || '',
// 					streetcode: branch.streetcode || '',
// 					zip: branch.zip,
// 					qnomycode: branch.qnomycode,
// 					qnomyWaitTimeCode: branch.qnomyWaitTimeCode,
// 					haszimuntor: branch.haszimuntor,
// 					isMakeAppointment: branch.haszimuntor,
// 					location: {
// 						// This conforms to elastic's { type: 'geo_point' } mapping upon 'location'.
// 						lat: branch.geocode_latitude,
// 						lon: branch.geocode_longitude,
// 					},
// 					services: [],
// 				};

// 				accumulator.push(newBranch);
// 			}
// 			return accumulator;
// 		},
// 		[]
// 	);
// 	console.log('[filterBranches] Done');

// 	console.log(
// 		'[filterBranches] Dataset size after filtering: ',
// 		Object.keys(filteredBranches).length
// 	);

// 	return filteredBranches;
// };
